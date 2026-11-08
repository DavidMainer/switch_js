function showMessageBox(message, callback = null) {
  const msgBox = document.getElementById("customMessageBox");
  const msgText = document.getElementById("messageBoxText");
  const msgCloseBtn = document.getElementById("messageBoxClose");

  if (!msgBox || !msgText || !msgCloseBtn) {
    console.error("Custom message box elements not found. Displaying via alert().");
    alert(message);
    if (callback) callback();
    return;
  }

  msgText.textContent = message;
  msgBox.classList.remove("hidden");

  const closeHandler = () => {
    msgBox.classList.add("hidden");
    msgCloseBtn.removeEventListener("click", closeHandler);
    if (callback) {
      callback();
    }
  };
  msgCloseBtn.addEventListener("click", closeHandler);
}

document.addEventListener("DOMContentLoaded", function () {
  console.group("MikroTik Initial POST Data Received:");
  console.log("From PHP Session (mikrotik_last_post_data):", {
    mac: "36:BE:17:F3:49:E8",
    ip: "10.180.6.61",
    "link-login": "http:\/\/mwea.net\/login?dst=http%3A%2F%2Fwww.msftconnecttest.com%2Fredirect",
    error: null,
    identity: "STN00003",
    hostname: "mwea.net",
    "hotspot-address": "10.180.0.1:80",
    "link-orig": "http:\/\/www.msftconnecttest.com\/redirect",
  });
  console.log("Current MikroTik Link Login:", "http://mwea.net/login?dst=http%3A%2F%2Fwww.msftconnecttest.com%2Fredirect");
  console.log("Current MikroTik Hotspot Address:", "10.180.0.1:80");
  console.log("Current MikroTik Original Link:", "http://www.msftconnecttest.com/redirect");
  console.groupEnd();

  console.group("Current MikroTik Session Variables:");
  console.log("MAC:", "36:BE:17:F3:49:E8");
  console.log("IP:", "10.180.6.61");
  console.log("Link Login:", "http://mwea.net/login?dst=http%3A%2F%2Fwww.msftconnecttest.com%2Fredirect");
  console.log("Error:", "N/A");
  console.log("Identity:", "STN00003");
  console.log("Hostname:", "mwea.net");
  console.log("Hotspot Address:", "10.180.0.1:80");
  console.log("Link Orig:", "http://www.msftconnecttest.com/redirect");
  console.groupEnd();

  const stationCode = "STN00003";
  const mikrotikHotspotAddress = "10.180.0.1:80";
  const mikroTikLinkLogin = "http://mwea.net/login?dst=http%3A%2F%2Fwww.msftconnecttest.com%2Fredirect";
  const mikroTikLinkOrig = "http://www.msftconnecttest.com/redirect";

  const mainContent = document.getElementById("mainContent");
  const packageList = document.getElementById("package-list");
  const phoneModal = document.getElementById("phoneModal");
  const closeModalSpan = document.getElementsByClassName("close")[0];
  const submitPhoneNumberBtn = document.getElementById("submitPhoneNumber");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const voucherInput = document.getElementById("voucherInput");
  const connectButton = document.querySelector(".connect");

  const paymentStatusCheckDiv = document.getElementById("paymentStatusCheck");
  const displayCheckoutIDSpan = document.getElementById("displayCheckoutID");
  const voucherCheckStatusDiv = document.getElementById("voucherCheckStatus");
  const displayVoucherCodeSpan = document.getElementById("displayVoucherCode");
  const adminContactNumberSpan = document.getElementById("adminContactNumber");
  const modalAdminContactNumberSpan = document.getElementById("modalAdminContactNumber");
  const modalTenantName = document.getElementById("modalTenantName");

  let selectedAmount = "";
  let selectedPackageId = "";
  let selectedDuration = "";
  let currentStationAccount = "";
  let currentPaybill = "";
  let pollingIntervalId = null;

  function formatDuration(expiration) {
    const match = expiration.match(/^(\d+)(mo|w|h|m)$/);
    if (!match) return expiration;
    const number = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case "mo":
        return `${number} month${number > 1 ? "s" : ""}`;
      case "w":
        return `${number} week${number > 1 ? "s" : ""}`;
      case "h":
        return `${number} hour${number > 1 ? "s" : ""}`;
      case "m":
        return `${number} minute${number > 1 ? "s" : ""}`;
      default:
        return expiration;
    }
  }

  function formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.startsWith("254254")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.startsWith("0")) {
      return "254" + cleaned.substring(1);
    }
    if (cleaned.startsWith("254")) {
      return cleaned;
    }
    if (/^(7|1)\d{8}$/.test(cleaned)) {
      return "254" + cleaned;
    }
    return cleaned;
  }

  function validatePhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[^0-9+]/g, "").trim();
    const patterns = [
      /^(07|01)\d{8}$/, // 070..., 010...
      /^(2547|2541)\d{8}$/, // 2547..., 2541...
      /^(7|1)\d{8}$/, // 7..., 1...
    ];

    return patterns.some((pattern) => pattern.test(cleaned));
  }

  function redirectToMikrotikLogin(username, password) {
    if (!mikrotikHotspotAddress) {
      showMessageBox("Could not determine MikroTik Hotspot Address for login. Please contact support.", () => {
        window.location.href = "index.php";
      });
      console.error("Missing MikroTik hotspot address for redirect.");
      return;
    }

    const redirectBase = `http://${mikrotikHotspotAddress}/login`;
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    params.append("dst", mikroTikLinkOrig || "");

    const finalRedirectUrl = `${redirectBase}?${params.toString()}`;
    console.log("Redirecting to MikroTik:", finalRedirectUrl);

    window.location.href = finalRedirectUrl;
  }

  const initialCheckoutRequestID = "";
  const initialFinalVoucher = "";

  if (initialCheckoutRequestID) {
    mainContent.classList.add("hidden");
    paymentStatusCheckDiv.classList.remove("hidden");
    displayCheckoutIDSpan.textContent = initialCheckoutRequestID;
    startPollingPaymentStatus(initialCheckoutRequestID);
  } else if (initialFinalVoucher) {
    mainContent.classList.add("hidden");
    voucherCheckStatusDiv.classList.remove("hidden");
    displayVoucherCodeSpan.textContent = initialFinalVoucher;
    checkVoucherCode(initialFinalVoucher);
  } else {
    mainContent.classList.remove("hidden");
    fetchPackages();
  }

  function fetchPackages() {
    // Show loading message for packages
    packageList.innerHTML = `<p>Loading packages...</p>`;
    // --- Hide Method 2 Payment Details ---
    // You can either get the elements directly here or from your 'elements' cache
    const paybillDisplay = document.getElementById("paybillNumberDisplay");
    const accountDisplay = document.getElementById("stationAccountDisplay");
    const amountDisplay = document.getElementById("amountForPayment");

    if (paybillDisplay) {
      paybillDisplay.style.display = "none";
    }
    if (accountDisplay) {
      accountDisplay.style.display = "none";
    }
    if (amountDisplay) {
      amountDisplay.style.display = "none";
    }

    fetch("fetch_packages.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      // Ensure 'stationCode' is defined and accessible in this scope
      body: new URLSearchParams({
        station_code: stationCode,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          // If the HTTP response is not OK (e.g., 404, 500), throw an error
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Parse JSON only if response is OK
      })

      .then((data) => {
        if (!data.success) {
          packageList.innerHTML = `<p style="color:red;">${data.message || "Failed to load packages."}</p>`;
          return;
        }

        if (data.theme) {
          const themeElement = document.getElementById("dynamic-theme");
          if (themeElement) {
            // Path is relative to your index.php
            themeElement.href = `css/${data.theme}`;
            document.body.style.opacity = "1";
          }
        }

        currentStationAccount = data.station_account || "";
        currentPaybill = data.paybill || "";

        // Ensure these DOM elements exist and are accessible
        if (adminContactNumberSpan) {
          adminContactNumberSpan.textContent = data.admin_phone_no;
        }
        if (modalAdminContactNumberSpan) {
          modalAdminContactNumberSpan.textContent = data.admin_phone_no;
        }

        if (modalTenantName) {
          modalTenantName.textContent = data.name;
        }

        // DYNAMIC BANNER UPDATE LOGIC
        const bannerBaseUrl = "./banner/"; // Path to your banner folder, relative to index.php
        const receivedBannerName = data.banner_name;

        const finalBannerPath = receivedBannerName ? `${bannerBaseUrl}${receivedBannerName}` : DEFAULT_FALLBACK_BANNER_PATH;

        // Ensure the bannerImage element exists before trying to set its src
        const bannerImageElement = document.getElementById("bannerImage");
        if (bannerImageElement) {
          bannerImageElement.src = finalBannerPath;
        } else {
          console.warn("Banner image element not found with ID 'bannerImage'. Cannot update banner dynamically.");
        }
        // END DYNAMIC BANNER UPDATE LOGIC

        packageList.innerHTML = ""; // Clear loading message

        if (data.packages && data.packages.length > 0) {
          data.packages.forEach((pkg) => {
            const duration = formatDuration(pkg.duration);
            const amount = parseFloat(pkg.amount);

            const div = document.createElement("div");
            div.className = "option";
            div.innerHTML = `
                        <div class="amount"><p><b>${amount.toLocaleString()}/=</b></p></div>
                        <div class="time"><p><b>${duration}</br>unlimited</b></p></div>
                        <div class="devices"><p><b>${pkg.simultaneous_use || 1} Device${(pkg.simultaneous_use || 1) > 1 ? "s" : ""}</br>${pkg.speed_name}</b></p></div>
                        <button class="buy" data-pkg-id="${pkg.id}" data-amount="${amount}" data-duration="${duration}" style="padding-left: 5px; padding-right: 5px;">Enjoy Now</button>
                    `;
            packageList.appendChild(div);
          });

          document.querySelectorAll(".option button.buy").forEach((button) => {
            button.addEventListener("click", function () {
              selectedPackageId = this.getAttribute("data-pkg-id");
              selectedAmount = this.getAttribute("data-amount");
              selectedDuration = this.getAttribute("data-duration");

              document.getElementById("chosenAmount").innerText = parseFloat(selectedAmount).toLocaleString();
              document.getElementById("chosenDuration").innerText = selectedDuration;

              document.getElementById("amountForPayment").innerText = parseFloat(selectedAmount).toLocaleString();
              document.getElementById("paybillNumberDisplay").innerText = currentPaybill;
              document.getElementById("stationAccountDisplay").innerText = currentStationAccount;

              /* ➤ TEMPORARY FIX – SHOW MANUAL PAY INSTEAD OF STK
                                    if (data.type === "paybill") {
                                        document.getElementById("manualPaybill").innerText = currentPaybill;
                                        document.getElementById("manualAccount").innerText = currentStationAccount;
                                        document.getElementById("manualAmount").innerText = selectedAmount;

                                        document.getElementById("manualPayPopup").classList.remove("hidden");
                                        return;
                                    } */

              // NORMAL OPERATION – OPEN STK POPUP
              phoneModal.classList.remove("hidden");
              phoneModal.style.display = "flex";
            });

            document.getElementById("manualPayOk").onclick = () => {
              document.getElementById("manualPayPopup").classList.add("hidden");
            };
          });
        } else {
          packageList.innerHTML = `<p>We are currently doin a system maintenance and we will be done by 15:00, If you have an active voucher scroll down to login</p>`;
        }
      })
      .catch((error) => {
        packageList.innerHTML = `<p style="color:red;">Failed to load packages. Please refresh the page or contact support.</p>`;
        console.error("Fetch packages error:", error);

        // In case of error, ensure a default banner is displayed
        const bannerImageElement = document.getElementById("bannerImage");
        if (bannerImageElement) {
          bannerImageElement.src = DEFAULT_FALLBACK_BANNER_PATH;
        }
      });
  }
  if (closeModalSpan) {
    closeModalSpan.onclick = function () {
      phoneModal.classList.add("hidden");
    };
  }

  window.onclick = function (event) {
    if (event.target === phoneModal) {
      phoneModal.classList.add("hidden");
    }
  };

  if (submitPhoneNumberBtn) {
    submitPhoneNumberBtn.onclick = function () {
      const phoneNumberInput = document.getElementById("phoneNumber");
      const phoneNumber = phoneNumberInput ? phoneNumberInput.value.trim() : "";

      if (!validatePhoneNumber(phoneNumber)) {
        showMessageBox("Please enter a valid phone number(e.g., 07XXXXXXXX or 2547XXXXXXXX).");
        return;
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      phoneModal.classList.add("hidden");
      loadingIndicator.classList.remove("hidden");

      const payload = {
        phone_number: formattedPhoneNumber,
        amount: selectedAmount,
        station_code: stationCode,
        package_id: selectedPackageId,
      };

      fetch("express.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          loadingIndicator.classList.add("hidden");

          if (data.success) {
            showMessageBox(data.message, () => {
              mainContent.classList.add("hidden");
              paymentStatusCheckDiv.classList.remove("hidden");
              displayCheckoutIDSpan.textContent = data.CheckoutRequestID;
              startPollingPaymentStatus(data.CheckoutRequestID);
            });
          } else {
            showMessageBox(data.message || "Failed to initiate STK Push. Please try again.");
          }
        })
        .catch((err) => {
          loadingIndicator.classList.add("hidden");
          console.error("Error in STK push:", err);
          showMessageBox("An error occurred during STK push. Please try again.");
        });
    };
  }
  if (connectButton) {
    connectButton.addEventListener("click", function () {
      const inputRaw = voucherInput ? voucherInput.value.trim() : "";
      const input = inputRaw.toUpperCase();

      if (input.length < 7) {
        showMessageBox("Please enter/paste M-Pesa message or voucher message.");
        return;
      }

      let extractedCode = null;

      const firstWord = input.split(" ")[0];
      if (/^[A-Z0-9]{10}$/.test(firstWord)) {
        extractedCode = firstWord;
      } else if (input.length === 10 && /^[A-Z0-9]{10}$/.test(input)) {
        extractedCode = input;
      } else if (input.length === 7 && /^[A-Z0-9]{7}$/.test(input)) {
        extractedCode = input;
      } else {
        const endVoucherMatch = input.match(/([A-Z0-9]{7})[.\s]*$/);
        if (endVoucherMatch) {
          extractedCode = endVoucherMatch[1];
        }
      }

      if (extractedCode) {
        loadingIndicator.classList.remove("hidden");
        checkVoucherCode(extractedCode);
      } else {
        // Keep this message box for direct user input errors where no code is found
        showMessageBox("Could not find a valid M-Pesa or voucher code. Please check your input.");
      }
      loadingIndicator.classList.add("hidden");
    });
  }

  function startPollingPaymentStatus(reqId) {
    if (pollingIntervalId) clearInterval(pollingIntervalId);

    const checkInterval = 3000;
    const timeout = 120000;
    const startTime = Date.now();

    const pollStatus = () => {
      if (Date.now() - startTime >= timeout) {
        clearInterval(pollingIntervalId);
        showMessageBox("Payment verification timed out. Please try again.", () => {
          window.location.href = "index.php";
        });
        return;
      }

      const requestUrl = `check_payment_status.php?checkoutReqID=${encodeURIComponent(reqId)}&station_code=${encodeURIComponent(stationCode)}`;
      fetch(requestUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (data.status === "completed") {
            clearInterval(pollingIntervalId);
            loadingIndicator.classList.add("hidden");
            redirectToMikrotikLogin(data.username, data.password);
          } else if (data.status === "pending") {
            if (paymentStatusCheckDiv) {
              paymentStatusCheckDiv.querySelector("p").innerText = data.message || "Waiting for M-Pesa payment confirmation...";
            }
          } else {
            clearInterval(pollingIntervalId);
            loadingIndicator.classList.add("hidden");
            showMessageBox(data.message || "Payment failed or not found. Please try again.", () => {
              window.location.href = "index.php";
            });
          }
        })
        .catch((error) => {
          clearInterval(pollingIntervalId);
          loadingIndicator.classList.add("hidden");
          showMessageBox("An error occurred while checking payment status. Please try again.", () => {
            window.location.href = "index.php";
          });
        });
    };
    pollingIntervalId = setInterval(pollStatus, checkInterval);
    pollStatus();
  }

  function checkVoucherCode(codeToSend) {
    const requestUrl = `check_voucher_code.php?extracted_code=${encodeURIComponent(codeToSend)}&station_code=${encodeURIComponent(stationCode)}`;
    fetch(requestUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          let countdown = 3;

          const interval = setInterval(() => {
            showMessageBox(`Code confirmed! Redirecting in ${countdown}...`, null, true, 900);

            countdown--;

            if (countdown < 0) {
              clearInterval(interval);
              redirectToMikrotikLogin(data.username, data.password);
            }
          }, 1000);
        } else if (data.status === "pending") {
          showMessageBox(data.message || "M-Pesa payment is still pending. Please wait a moment and try again.");
        } else {
          showMessageBox(data.message || "Invalid code or payment status. Please try again.", () => {
            if (voucherInput) voucherInput.value = "";
          });
        }
      })
      .catch((error) => {
        showMessageBox("An error occurred while checking the code. Please try again.", () => {
          window.location.href = "index.php";
        });
      });
  }
});
