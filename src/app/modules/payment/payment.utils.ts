import type { Response } from "express";

const paymentPage = (
  res: Response,
  {
    title,
    message,
    icon,
    iconColor,
    isSuccess,
  }: {
    title: string;
    message: string;
    icon: string;
    iconColor: string;
    isSuccess: boolean;
  },
) => {
  res.type("html").send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>${title} | Bidyut</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;

      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background:
        radial-gradient(
          circle at top,
          ${isSuccess ? "#12351f" : "#351818"} 0%,
          #111 45%,
          #080808 100%
        );

      color: #fff;
    }

    .container {
      width: 100%;
      max-width: 520px;
      padding: 44px 36px;

      text-align: center;

      background: rgba(26, 26, 26, 0.92);
      border: 1px solid #333;
      border-radius: 20px;

      box-shadow:
        0 25px 60px rgba(0, 0, 0, 0.45),
        0 0 80px ${isSuccess ? "rgba(74, 222, 128, 0.08)" : "rgba(248, 113, 113, 0.08)"};
    }

    .icon {
      width: 76px;
      height: 76px;

      margin: 0 auto 24px;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 50%;

      background: ${isSuccess ? "rgba(74, 222, 128, 0.12)" : "rgba(248, 113, 113, 0.12)"};

      border: 1px solid ${iconColor};

      color: ${iconColor};

      font-size: 36px;
      font-weight: 700;

      box-shadow:
        0 0 30px ${isSuccess ? "rgba(74, 222, 128, 0.12)" : "rgba(248, 113, 113, 0.12)"};
    }

    h1 {
      margin: 0 0 14px;

      font-size: 28px;
      line-height: 1.2;
      font-weight: 700;

      color: #fff;
    }

    .message {
      margin: 0 auto 12px;

      max-width: 420px;

      color: #d4d4d4;

      font-size: 16px;
      line-height: 1.6;
    }

    .thank-you {
      margin: 0 auto;

      max-width: 400px;

      color: #888;

      font-size: 14px;
      line-height: 1.6;
    }

    .brand {
      margin-top: 32px;

      color: #555;

      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .brand span {
      color: ${iconColor};
    }

    @media (max-width: 600px) {
      .container {
        padding: 36px 24px;
      }

      h1 {
        font-size: 24px;
      }
    }
  </style>
</head>

<body>
  <main class="container">

    <div class="icon">
      ${icon}
    </div>

    <h1>${title}</h1>

    <p class="message">
      ${message}
    </p>

    <p class="thank-you">
      Thank you for using Bidyut. We appreciate your trust
      and hope you have a great experience with our service.
    </p>

    <div class="brand">
      ⚡ <span>Bidyut</span>
    </div>

  </main>
</body>
</html>
  `);
};

const paymentSuccessPage = (res: Response) => {
  paymentPage(res, {
    title: "Payment Successful",
    message:
      "Your payment has been completed successfully. Your transaction is being processed and your account will be updated shortly.",
    icon: "✓",
    iconColor: "#4ade80",
    isSuccess: true,
  });
};

const paymentCancelPage = (res: Response) => {
  paymentPage(res, {
    title: "Payment Cancelled",
    message:
      "Your payment was cancelled and no payment was completed. You can safely return to Bidyut and try again whenever you're ready.",
    icon: "×",
    iconColor: "#f87171",
    isSuccess: false,
  });
};

export const paymentUtils = {
  paymentSuccessPage,
  paymentCancelPage,
};
