import { useEffect, useState } from "react";
import "./Home.css";

type PaymentStatus =
    | "PAID"
    | "CAPTURED"
    | "PENDING"
    | "CANCELED";

export default function Home() {
    const [licensePlate, setLicensePlate] = useState("");
    const [showPayment, setShowPayment] = useState(false);

    const [paymentStatus, setPaymentStatus] =
        useState<PaymentStatus | null>(null);

    const [isPaying, setIsPaying] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [parkingId] = useState(() => Date.now());
    const amount = "12.50";

    const licensePlateRegex =
        /^[A-ZÄÖÜ]{1,3}-[A-ZÄÖÜ]{1,2}\s?\d{1,4}$/;

    const isValid =
        licensePlateRegex.test(licensePlate.trim());

    const handleContinue = () => {
        if (!isValid) return;

        setShowPayment(true);
    };

    const handlePayment = async () => {
        try {
            setErrorMessage("");
            setIsPaying(true);

            const response = await fetch("/parkpay/v1", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: parkingId,
                    kennzeichen: licensePlate,
                    betrag: amount,
                }),
            });

            if (!response.ok) {
                throw new Error(
                    "Zahlung fehlgeschlagen."
                );
            }

            const data = await response.json();

            setPaymentStatus(data.status);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unbekannter Fehler"
            );
        } finally {
            setIsPaying(false);
        }
    };

    useEffect(() => {
        if (paymentStatus !== "PENDING") {
            return;
        }

        const updatePaymentStatus = async () => {
            try {
                const response = await fetch(
                    `/parkpay/v1/${parkingId}`
                );

                if (!response.ok) {
                    console.error(
                        "Status konnte nicht geladen werden:",
                        response.status
                    );
                    return;
                }

                const data = await response.json();

                console.log("Payment Status:", data.status);

                setPaymentStatus(data.status);
            } catch (error) {
                console.error(
                    "Fehler beim Abrufen des Zahlungsstatus:",
                    error
                );
            }
        };

        void updatePaymentStatus();

        const interval = window.setInterval(() => {
            void updatePaymentStatus();
        }, 2000);

        return () => {
            window.clearInterval(interval);
        };
    }, [paymentStatus, parkingId]);

    const paymentFinished =
        paymentStatus === "PAID" ||
        paymentStatus === "CAPTURED";

    return (
        <div className="home">
            <header className="header">
                <div className="header-inner">
                    <div className="brand">
                        <div className="logo-box">P</div>

                        <div>
                            <div className="brand-title">
                                ParkPay
                            </div>

                            <div className="brand-subtitle">
                                XYZ Parkräume GmbH
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <section className="intro">
                        <h1>Parkgebühr bezahlen</h1>
                        <p> Geben Sie Ihr Kennzeichen ein, um Ihre offene Parkgebühr aufzurufen und anschließend zu bezahlen.</p>
                    </section>

                    <section className="payment-card">
                        {!showPayment ? (
                            <>
                                <label htmlFor="licensePlate">Kennzeichen</label>

                                <input
                                    id="licensePlate"
                                    type="text"
                                    value={licensePlate}
                                    onChange={(event) =>
                                        setLicensePlate(
                                            event.target.value.toUpperCase()
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" &&
                                            isValid
                                        ) {
                                            handleContinue();
                                        }
                                    }}
                                    placeholder="M-XY 1234"
                                    autoComplete="off"
                                />

                                <p className="hint"> Geben Sie das Kennzeichen des geparkten Fahrzeugs ein. </p>

                                <button className="primary-button" type="button" disabled={!isValid} onClick={handleContinue}>Weiter zur Zahlung</button>
                            </>
                        ) : paymentFinished ? (
                            <div className="payment-success">
                                <div className="success-icon">
                                    ✓
                                </div>
                                <h2>Zahlung erfolgreich</h2>
                                <p>Ihre Parkgebühr wurde erfolgreich bezahlt.</p>
                                <div className="license-value">
                                    {licensePlate}
                                </div>
                            </div>
                        ) : paymentStatus === "CANCELED" ? (
                            <div className="payment-success">
                                <h2>Zahlung abgebrochen</h2>
                                <p>Die Zahlung wurde nicht durchgeführt.</p>
                                <button className="primary-button" type="button" onClick={() => setPaymentStatus(null)}>
                                    Erneut versuchen
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="license-box">
                                    <div>
                                        <div className="license-label">
                                            Kennzeichen
                                        </div>

                                        <div className="license-value">
                                            {licensePlate}
                                        </div>
                                    </div>

                                    {!paymentStatus && (
                                        <button className="change-button" type="button" onClick={() => setShowPayment(false)}>
                                            Ändern
                                        </button>
                                    )}
                                </div>

                                <div className="payment-section">
                                    <div className="payment-title">
                                        Parkgebühr
                                    </div>

                                    <div className="amount">
                                        {amount.replace(".", ",")} €
                                    </div>

                                    {paymentStatus === "PENDING" ? (
                                        <div className="payment-pending">
                                            <div className="spinner" />

                                            <div>
                                                Zahlung wird verarbeitet...
                                            </div>

                                            <span>
                                                Status: {paymentStatus}
                                            </span>
                                        </div>
                                    ) : (
                                        <button className="primary-button" type="button" disabled={isPaying} onClick={handlePayment}>
                                            {isPaying
                                                ? "Zahlung wird gestartet..."
                                                : `${amount.replace(".", ",")} € bezahlen`}
                                        </button>
                                    )}

                                    {errorMessage && (
                                        <p className="payment-error">
                                            {errorMessage}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </section>

                    <div className="secure-info">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <rect
                                width="18"
                                height="11"
                                x="3"
                                y="11"
                                rx="2"
                            />

                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                </div>
            </main>

            <footer>
                © {new Date().getFullYear()} XYZ Parkräume GmbH
            </footer>
        </div>
    );
}