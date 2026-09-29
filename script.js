// ================================
// CONFIGURATION & DOM ELEMENTS
// ================================
const API_URL = "http://127.0.0.1:8000/predict";

const form = document.getElementById("predictionForm");
const predictBtn = document.getElementById("predictBtn");
const buttonText = document.getElementById("buttonText");

const resultCard = document.getElementById("resultCard");
const prediction = document.getElementById("prediction");
const probabilitiesDiv = document.getElementById("probabilities");

const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");


// ================================
// FORM SUBMIT EVENT LISTENER
// ================================
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Hide old result/error
    resultCard.classList.remove("show");
    errorBox.classList.remove("show");

    // Loading animation
    predictBtn.disabled = true;
    predictBtn.classList.add("loading");

    try {
        // ================================
        // GET FORM VALUES
        // ================================
        const data = {
            latitude: parseFloat(document.getElementById("latitude").value),
            longitude: parseFloat(document.getElementById("longitude").value),
            price: parseFloat(document.getElementById("price").value),
            minimum_nights: parseInt(document.getElementById("minimum_nights").value, 10),
            number_of_reviews: parseInt(document.getElementById("number_of_reviews").value, 10),
            reviews_per_month: parseFloat(document.getElementById("reviews_per_month").value),
            calculated_host_listings_count: parseInt(document.getElementById("calculated_host_listings_count").value, 10),
            availability_365: parseInt(document.getElementById("availability_365").value, 10),
            neighbourhood_group: document.getElementById("neighbourhood_group").value,
            neighbourhood: document.getElementById("neighbourhood").value
        };

        // ================================
        // SEND DATA TO FASTAPI
        // ================================
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        // ================================
        // HANDLE API ERROR
        // ================================
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail
                    ? JSON.stringify(errorData.detail)
                    : "Prediction failed."
            );
        }

        // ================================
        // GET RESPONSE
        // ================================
        const result = await response.json();

        // ================================
        // SHOW PREDICTION
        // ================================
        prediction.textContent = result.Predicted_room_type;

        // ================================
        // SHOW PROBABILITIES
        // ================================
        probabilitiesDiv.innerHTML = "";

        if (result.Probabilities) {
            const probabilities = result.Probabilities;

            Object.entries(probabilities)
                .sort((a, b) => b[1] - a[1])
                .forEach(([className, probability]) => {
                    const percentage = (probability * 100).toFixed(2);

                    const probabilityHTML = `
                        <div class="probability">
                            <div class="probability-header">
                                <span>${className}</span>
                                <span>${percentage}%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" data-width="${percentage}%"></div>
                            </div>
                        </div>
                    `;

                    probabilitiesDiv.insertAdjacentHTML("beforeend", probabilityHTML);
                });
        }

        // ================================
        // SHOW RESULT CARD & ANIMATE
        // ================================
        resultCard.classList.add("show");

        // Animate progress bars after card renders
        setTimeout(() => {
            document.querySelectorAll(".progress-bar").forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        }, 100);

        // Scroll to result card
        resultCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
    catch (error) {
    console.error("API Error:", error);

    errorMessage.textContent =
        "Invalid input. Please check your values, especially latitude and longitude.";

    errorBox.classList.add("show");
    }  
    finally {
        predictBtn.disabled = false;
        predictBtn.classList.remove("loading");
    }
});