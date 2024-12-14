const exclusionRules = {
    "Hallway": ["Couch", "Armchair", "Coffee table", "Rug", "Fireplace", "Floor lamp", "Side table", "Decorative pillows", "TV", "Dining table"],
    "Fireplace": ["Hallway"],
    "Dining room": ["Couch"],
    "Kitchen": ["TV"],
    "Yoga": ["Large group"],
    "Boxing bag": ["Group fitness"],
    "High-end gym": ["Industrial"],
    "Luxury sedan": ["Family with kids"],
    "Compact car": ["Tourists"],
    "Coastal areas": ["Electric vehicle"],
    "Large meeting": ["Focused"],
    "Typing": ["Energetic"],
    "Creative": ["Serious"],
    "Reading a book": ["Angry"],
    "Socializing": ["Calm"],
    "Sporty": ["Teaching"],
    "Cityscape": ["Cottage"],
    "Luxury": ["Suburban"],
    "Loft": ["Countryside"]
};

document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        examplePromptDiv: document.getElementById("example-prompt"),
        promptText: document.getElementById("prompt-text"),
        confirmationMessage: document.getElementById("confirmation-message"),
        toggleNightModeButton: document.getElementById("toggle-night-mode"),
        resetFormButton: document.getElementById("reset-form"),
        generatePromptButton: document.getElementById("generate-prompt"),
        randomChoicesButton: document.getElementById("random-choices"),
        generateMultipleButton: document.getElementById("generate-multiple")
    };

    const fetchQuestions = async (path) => {
        try {
            const response = await fetch(path);
            return response.json();
        } catch (error) {
            console.error("Error loading questions:", error);
            return null;
        }
    };

    const generateQuestions = (formId, questions) => {
        const form = document.getElementById(formId);
        if (!form) return;

        form.innerHTML = ""; // Clear existing content

        questions.forEach(({ question, type, name, options }) => {
            const container = document.createElement("div");
            container.classList.add("mb-3");

            const questionText = document.createElement("p");
            questionText.textContent = question;

            const answersDiv = document.createElement("div");
            answersDiv.classList.add("answers");

            options.forEach(({ label, value, weight }) => {
                const labelElement = document.createElement("label");
                const input = document.createElement("input");
                input.type = type;
                input.name = name;
                input.value = value;
                input.dataset.weight = weight || 0;

                labelElement.appendChild(input);
                labelElement.append(label);
                answersDiv.appendChild(labelElement);

                input.addEventListener("change", () => {
                    updateVisualSelection(answersDiv);
                    applyExclusionRules(formId);
                });
            });

            container.appendChild(questionText);
            container.appendChild(answersDiv);
            form.appendChild(container);
        });
    };

    const updateVisualSelection = (answersDiv) => {
        answersDiv.querySelectorAll("label").forEach(label => label.classList.remove("selected"));
        answersDiv.querySelectorAll("input:checked").forEach(input => {
            input.closest("label").classList.add("selected");
        });
    };

    const applyExclusionRules = (formId) => {
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll("input");

        inputs.forEach(input => {
            input.disabled = false;
            input.closest("label").classList.remove("disabled");
        });

        inputs.forEach(input => {
            if (input.checked) {
                (exclusionRules[input.value] || []).forEach(excludedValue => {
                    const excludedInput = form.querySelector(`input[value="${excludedValue}"]`);
                    if (excludedInput) {
                        excludedInput.disabled = true;
                        excludedInput.closest("label").classList.add("disabled");
                    }
                });
            }
        });
    };

    const weightedRandomChoice = (options) => {
        const totalWeight = options.reduce((sum, { weight }) => sum + (weight || 0), 0);
        const random = Math.random() * totalWeight;
        let cumulativeWeight = 0;

        for (const option of options) {
            cumulativeWeight += option.weight || 0;
            if (random < cumulativeWeight) return option;
        }

        return options[options.length - 1];
    };

    const selectRandomChoices = (formId) => {
        const form = document.getElementById(formId);
        form.querySelectorAll(".answers").forEach(question => {
            const options = Array.from(question.querySelectorAll("input")).map(input => ({
                input,
                weight: parseFloat(input.dataset.weight) || 0
            }));
            const selectedOption = weightedRandomChoice(options);

            question.querySelectorAll("input").forEach(input => {
                input.checked = input === selectedOption.input;
                input.dispatchEvent(new Event("change"));
            });
        });
    };

    const generatePrompt = (formId) => {
        const form = document.getElementById(formId);
        return Array.from(form.querySelectorAll(".mb-3"))
            .map(section => {
                const question = section.querySelector("p").textContent.trim();
                const selectedOptions = Array.from(section.querySelectorAll("input:checked")).map(input => input.value);
                return selectedOptions.length ? `${question}: ${selectedOptions.join(", ")}` : null;
            })
            .filter(Boolean)
            .join("\n");
    };

    const resetForm = () => {
        const activeTab = document.querySelector(".tab-pane.active form");
        if (!activeTab) return;

        activeTab.querySelectorAll("input").forEach(input => {
            input.checked = false;
            input.disabled = false;
            input.closest("label").classList.remove("disabled");
        });

        applyExclusionRules(activeTab.id);
        elements.examplePromptDiv.classList.add("d-none");
        elements.examplePromptDiv.style.display = "none";
    };

    const generateMultiplePrompts = (formId, count = 10) => {
        return Array.from({ length: count })
            .map(() => {
                selectRandomChoices(formId);
                return generatePrompt(formId);
            })
            .join("\n\n");
    };

    const copyToClipboard = (text, message) => {
        navigator.clipboard.writeText(text).then(() => {
            elements.confirmationMessage.textContent = message;
            elements.confirmationMessage.classList.remove("d-none");
            setTimeout(() => elements.confirmationMessage.classList.add("d-none"), 3000);
        });
    };

    const initializeEventListeners = () => {
        elements.resetFormButton.addEventListener("click", resetForm);

        elements.generatePromptButton.addEventListener("click", () => {
            const activeForm = document.querySelector(".tab-pane.active form");
            const prompt = generatePrompt(activeForm.id);
            elements.promptText.textContent = prompt || "Your prompt will appear here after you make a selection.";
            elements.examplePromptDiv.classList.remove("d-none");
            copyToClipboard(prompt, "Prompt generated and copied!");
        });

        elements.randomChoicesButton.addEventListener("click", () => {
            const activeForm = document.querySelector(".tab-pane.active form");
            selectRandomChoices(activeForm.id);
            const prompt = generatePrompt(activeForm.id);
            elements.promptText.textContent = prompt || "Your prompt will appear here after you make a selection.";
            elements.examplePromptDiv.classList.remove("d-none");
            copyToClipboard(prompt, "Random choices selected and copied!");
        });

        elements.generateMultipleButton.addEventListener("click", () => {
            const activeForm = document.querySelector(".tab-pane.active form");
            const prompts = generateMultiplePrompts(activeForm.id);
            copyToClipboard(prompts, "10 weighted prompts generated and copied!");
        });

        elements.toggleNightModeButton.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
        });
    };

    const init = async () => {
        const questions = await fetchQuestions("questions.json");
        if (!questions) return;

        generateQuestions("room-form", questions.print);
        generateQuestions("gym-form", questions.gyms);
        generateQuestions("taxi-form", questions.taxis);
        generateQuestions("business-form", questions.business);
        generateQuestions("people-form", questions.people);
        generateQuestions("real-estate-form", questions.realEstate);

        initializeEventListeners();
    };

    init();
});
