import { useState } from "react";
import "./Home.css";

export default function Home() {
    const [licensePlate, setLicensePlate] = useState("");
    const [showPayment, setShowPayment] = useState(false);

    const isValid = licensePlate.trim().length > 0;

    const handleContinue = () => {
        if (!isValid) return;
        setShowPayment(true);
    };

    return (
        <div className="home">
            <header className="header">
                <div className="header-inner">
                    <div className="brand">
                        <div className="logo-box">P</div>
                        <div>
                            <div className="brand-title">ParkPay</div>
                            <div className="brand-subtitle">XYZ Parkräume GmbH</div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="content">
                    <section className="intro">
                        <h1>Parkgebühr bezahlen</h1>
                        <p>
                            Geben Sie Ihr Kennzeichen ein, um Ihre offene Parkgebühr
                            aufzurufen und anschließend sicher zu bezahlen.
                        </p>
                    </section>

                    <section className="payment-card">
                        {!showPayment ? (
                            <>
                                <label htmlFor="licensePlate">Kennzeichen</label>

                                <input id="licensePlate" type="text"
                                    value={licensePlate}
                                    onChange={(event) =>
                                        setLicensePlate(event.target.value.toUpperCase())
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && isValid) {
                                            handleContinue();
                                        }
                                    }}
                                    placeholder="M-XY 1234"
                                    autoComplete="off"
                                />
                                <p className="hint">Geben Sie das Kennzeichen des geparkten Fahrzeugs ein.</p>
                                <button className="primary-button" type="button" disabled={!isValid} onClick={handleContinue}>Weiter zur Zahlung</button>
                            </>
                        ) : (
                            <>
                                <div className="license-box">
                                    <div>
                                        <div className="license-label">Kennzeichen</div>
                                        <div className="license-value">{licensePlate}</div>
                                    </div>

                                    <button className="change-button" type="button" onClick={() => setShowPayment(false)}>Ändern</button>
                                </div>

                                <div className="payment-section">
                                    <div className="payment-title">Zahlungsmethode</div>
                                    <button className="paypal-placeholder" type="button">PayPal</button>
                                    <p className="payment-hint">PayPal-Integration folgt</p>
                                </div>
                            </>
                        )}
                    </section>

                    <div className="secure-info">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="11" x="3" y="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>Sichere Zahlungsabwicklung</span>
                    </div>
                </div>
            </main>

            <footer>© {new Date().getFullYear()} XYZ Parkräume GmbH</footer>
        </div>
    );
}