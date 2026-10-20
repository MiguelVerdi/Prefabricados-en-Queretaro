import { RequestQuoteBody, RequestQuoteResponse } from "@workspace/api-zod";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

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
  const emailProvider =
    process.env.EMAIL_PROVIDER ?? (process.env.REPL_ID ? "replit" : "sendgrid");
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  if (
    !hcaptchaSecret ||
    !recipient ||
    !sender ||
    !["replit", "sendgrid"].includes(emailProvider) ||
    (emailProvider === "sendgrid" && !sendgridApiKey)
  ) {
    req.log.error(
      {
        hcaptchaConfigured: Boolean(hcaptchaSecret),
        recipientConfigured: Boolean(recipient),
        senderConfigured: Boolean(sender),
        emailProvider,
        sendgridApiKeyConfigured: Boolean(sendgridApiKey),
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

  const requestedProduct = quote.product?.trim();
  const subject = requestedProduct
    ? `Solicitud de cotización: ${requestedProduct}`
    : "Solicitud de información y cotización";
  const message = [
    "Nueva solicitud de cotización desde la página de Prefabricados Huimilpan",
    "",
    `Nombre: ${quote.name.trim()}`,
    `Correo: ${quote.email.trim()}`,
    `Teléfono: ${quote.phone?.trim() || "No proporcionado"}`,
    `Ciudad: ${quote.city?.trim() || "No especificada"}`,
    `Producto solicitado: ${requestedProduct || "No especificado"}`,
    `Cantidad aproximada: ${quote.quantity?.trim() || "No especificada"}`,
    "",
    "Detalles del proyecto:",
    quote.message?.trim() || "Sin detalles adicionales.",
  ].join("\n");

  try {
    const mail = {
      personalizations: [{ to: [{ email: recipient }], subject }],
      from: { email: sender, name: "Prefabricados Huimilpan" },
      reply_to: { email: quote.email.trim(), name: quote.name.trim() },
      subject,
      content: [{ type: "text/plain", value: message }],
    };

    let responseOk: boolean;
    let responseStatus: number;

    if (emailProvider === "sendgrid") {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mail),
      });
      responseOk = response.ok;
      responseStatus = response.status;
    } else {
      const { ReplitConnectors } = await import("@replit/connectors-sdk");
      const connectors = new ReplitConnectors();
      const response = await connectors.proxy("sendgrid", "/v3/mail/send", {
        method: "POST",
        body: mail,
      });
      responseOk = response.ok;
      responseStatus = response.status;
    }

    if (!responseOk) {
      req.log.error(
        { statusCode: responseStatus, emailProvider },
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
