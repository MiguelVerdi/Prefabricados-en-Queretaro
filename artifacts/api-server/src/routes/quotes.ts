import { ReplitConnectors } from "@replit/connectors-sdk";
import { RequestQuoteBody, RequestQuoteResponse } from "@workspace/api-zod";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const sendgrid = new ReplitConnectors();

router.post("/quotes", async (req, res): Promise<void> => {
  const parsed = RequestQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Revisa los datos del formulario." });
    return;
  }

  const quote = parsed.data;

  // Silently accept bot submissions caught by the hidden honeypot.
  if (quote.website?.trim()) {
    res.status(202).json(
      RequestQuoteResponse.parse({
        success: true,
        message: "Tu solicitud fue recibida.",
      }),
    );
    return;
  }

  const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY;
  const recipient = process.env.QUOTE_RECIPIENT_EMAIL;
  const sender = process.env.QUOTE_SENDER_EMAIL;

  if (!hcaptchaSecret || !recipient || !sender) {
    req.log.error(
      {
        hcaptchaConfigured: Boolean(hcaptchaSecret),
        recipientConfigured: Boolean(recipient),
        senderConfigured: Boolean(sender),
      },
      "Quote request delivery is not configured",
    );
    res.status(503).json({
      error: "El formulario aún no está disponible. Inténtalo más tarde.",
    });
    return;
  }

  let captchaValid = false;
  try {
    const verification = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: hcaptchaSecret,
        response: quote.captchaToken,
      }),
    });

    if (verification.ok) {
      const result: unknown = await verification.json();
      captchaValid =
        typeof result === "object" &&
        result !== null &&
        "success" in result &&
        result.success === true;
    }
  } catch (error) {
    req.log.error({ err: error }, "hCaptcha verification request failed");
    res.status(503).json({
      error: "No pudimos verificar el formulario. Inténtalo de nuevo.",
    });
    return;
  }

  if (!captchaValid) {
    res.status(400).json({
      error: "Completa la verificación humana e inténtalo de nuevo.",
    });
    return;
  }

  const subject = `Solicitud de cotización: ${quote.product.trim()}`;
  const message = [
    "Nueva solicitud de cotización desde la página de Prefabricados en Querétaro",
    "",
    `Nombre: ${quote.name.trim()}`,
    `Correo: ${quote.email.trim()}`,
    `Teléfono: ${quote.phone?.trim() || "No proporcionado"}`,
    `Ciudad: ${quote.city.trim()}`,
    `Producto solicitado: ${quote.product.trim()}`,
    `Cantidad aproximada: ${quote.quantity?.trim() || "No especificada"}`,
    "",
    "Detalles del proyecto:",
    quote.message.trim(),
  ].join("\n");

  try {
    const response = await sendgrid.proxy("sendgrid", "/v3/mail/send", {
      method: "POST",
      body: {
        personalizations: [{ to: [{ email: recipient }], subject }],
        from: { email: sender, name: "Prefabricados en Querétaro" },
        reply_to: { email: quote.email.trim(), name: quote.name.trim() },
        subject,
        content: [{ type: "text/plain", value: message }],
      },
    });

    if (!response.ok) {
      req.log.error(
        { statusCode: response.status },
        "SendGrid rejected a quote email",
      );
      res.status(503).json({
        error:
          "No pudimos enviar tu solicitud en este momento. Inténtalo de nuevo más tarde.",
      });
      return;
    }
  } catch (error) {
    req.log.error({ err: error }, "SendGrid quote email request failed");
    res.status(503).json({
      error:
        "No pudimos enviar tu solicitud en este momento. Inténtalo de nuevo más tarde.",
    });
    return;
  }

  req.log.info("Quote request sent to the configured business inbox");
  res.status(202).json(
    RequestQuoteResponse.parse({
      success: true,
      message: "Gracias. Tu solicitud de cotización fue enviada.",
    }),
  );
});

export default router;
