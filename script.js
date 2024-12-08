const exclusionRules = {
     // Rooms
    "Hallway": ["Couch", "Armchair", "Coffee table", "Rug", "Fireplace", "Floor lamp", "Side table", "Decorative pillows", "TV", "Dining table"],
    "Fireplace": ["Hallway"],
    "Dining room": ["Couch"],
    "Kitchen": ["TV"],

    // Gyms
    "Yoga": ["Large group"],
    "Boxing bag": ["Group fitness"],
    "High-end gym": ["Industrial"],

    // Taxis
    "Luxury sedan": ["Family with kids"],
    "Compact car": ["Tourists"],
    "Coastal areas": ["Electric vehicle"],

    // Business
    "Large meeting": ["Focused"],
    "Typing": ["Energetic"],
    "Creative": ["Serious"],

    // People
    "Reading a book": ["Angry"],
    "Socializing": ["Calm"],
    "Sporty": ["Teaching"],

    // Real estate
    "Cityscape": ["Cottage"],
    "Luxury": ["Suburban"],
    "Loft": ["Countryside"]
};
document.addEventListener("DOMContentLoaded", () => {
    const examplePromptDiv = document.getElementById("example-prompt");
    const promptText = document.getElementById("prompt-text");
    const confirmationMessage = document.getElementById("confirmation-message");
    const toggleNightModeButton = document.getElementById("toggle-night-mode");

    const loadQuestions = async () => {
        try {
            const response = await fetch("questions.json");
            const questions = await response.json();
            generateQuestionsWithWeights("room-form", questions.print);
            generateQuestionsWithWeights("gym-form", questions.gyms);
            generateQuestionsWithWeights("taxi-form", questions.taxis);
            generateQuestionsWithWeights("business-form", questions.business);
            generateQuestionsWithWeights("people-form", questions.people);
            generateQuestionsWithWeights("real-estate-form", questions.realEstate);
        } catch (error) {
            console.error("Error loading questions:", error);
        }
    };    

    const generateQuestionsWithWeights = (formId, questions) => {
        const form = document.getElementById(formId);
        form.innerHTML = ""; // Maak het formulier leeg
    
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
                input.dataset.weight = weight || 0; // Voeg gewicht toe, standaard 0
    
                labelElement.appendChild(input);
                labelElement.append(label);
                answersDiv.appendChild(labelElement);
    
                // **Hier voeg je de change-eventlistener toe**
                input.addEventListener("change", () => {
                    updateVisualSelection(answersDiv); // Werk visuele selectie bij
                    applyExclusionRules(formId); // Pas uitsluitingen toe
                });                               
            });
    
            container.appendChild(questionText);
            container.appendChild(answersDiv);
            form.appendChild(container);
        });
    };

    function updateVisualSelection(answersDiv) {
        const labels = answersDiv.querySelectorAll("label");
        labels.forEach(label => label.classList.remove("selected"));
        const checkedInputs = answersDiv.querySelectorAll("input:checked");
        checkedInputs.forEach(input => {
            const associatedLabel = input.closest("label");
            if (associatedLabel) associatedLabel.classList.add("selected");
        });
    }

    const applyExclusionRules = (formId) => {
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll("input");
    
        // Reset alle inputs naar standaardstatus
        inputs.forEach(input => {
            input.disabled = false; // Zorg ervoor dat alles standaard inschakelbaar is
            const label = input.closest("label");
            if (label) {
                label.classList.remove("disabled"); // Verwijder 'disabled' styling
            }
        });
    
        // Loop door geselecteerde inputs en pas uitsluitingen toe
        inputs.forEach(input => {
            if (input.checked) {
                const exclusions = exclusionRules[input.value] || [];
                exclusions.forEach(excludedValue => {
                    const excludedInput = form.querySelector(`input[value="${excludedValue}"]`);
                    if (excludedInput) {
                        excludedInput.disabled = true; // Schakel uitgesloten opties uit
                        const label = excludedInput.closest("label");
                        if (label) {
                            label.classList.add("disabled"); // Voeg visuele styling toe
                        }
                    }
                });
            }
        });
    };    

    const weightedRandomChoice = (options) => {
        const cumulativeWeights = [];
        let sum = 0;

        options.forEach(option => {
            sum += option.weight || 0; // Voeg het gewicht toe
            cumulativeWeights.push(sum); // Voeg cumulatieve som toe
        });

        const random = Math.random() * sum;

        for (let i = 0; i < cumulativeWeights.length; i++) {
            if (random < cumulativeWeights[i]) {
                return options[i];
            }
        }
        return options[options.length - 1]; // Fallback
    };

    const selectRandomChoicesWithWeights = (formId) => {
        const form = document.getElementById(formId);
        const questions = form.querySelectorAll(".answers");

        questions.forEach(question => {
            const inputs = question.querySelectorAll("input");
            const options = Array.from(inputs).map(input => ({
                input: input,
                weight: parseFloat(input.dataset.weight) || 0
            }));

            const selectedOption = weightedRandomChoice(options);

            inputs.forEach(input => {
                input.checked = (input === selectedOption.input);
                input.dispatchEvent(new Event("change"));
            });
        });
    };

    const generatePrompt = (formId) => {
        const form = document.getElementById(formId);
        const sections = form.querySelectorAll(".mb-3");
        const promptParts = [];
        sections.forEach(section => {
            const questionText = section.querySelector("p").textContent.trim();
            const selectedOptions = [...section.querySelectorAll("input:checked")].map(input => input.value);
            if (selectedOptions.length > 0) {
                promptParts.push(`${questionText}: ${selectedOptions.join(", ")}`);
            }
        });
        return promptParts.join("\n");
    };

    const updatePromptInUI = (prompt) => {
        promptText.textContent = prompt || "Your prompt will appear here after you make a selection.";
        examplePromptDiv.classList.remove("d-none");
        examplePromptDiv.style.display = "block";
    };

    const resetForm = () => {
        const activeTab = document.querySelector(".tab-pane.active");
        const form = activeTab.querySelector("form");
        const inputs = form.querySelectorAll("input");
    
        inputs.forEach(input => {
            input.checked = false; // Deselecteer alle opties
            input.disabled = false; // Schakel alle opties weer in
            const label = input.closest("label");
            if (label) {
                label.classList.remove("disabled"); // Verwijder 'disabled' stijl
            }
        });
    
        applyExclusionRules(form.id); // Pas uitsluitingen opnieuw toe
    
        // Verberg voorbeeld prompt
        const examplePromptDiv = document.getElementById("example-prompt");
        if (examplePromptDiv) {
            examplePromptDiv.classList.add("d-none");
            examplePromptDiv.style.display = "none";
        }
    };    

    const generateMultiplePromptsWithWeights = (formId, count = 10) => {
        const prompts = [];
        for (let i = 0; i < count; i++) {
            selectRandomChoicesWithWeights(formId);
            prompts.push(generatePrompt(formId));
        }
        return prompts.join("\n\n");
    };

    const copyToClipboard = (text, message) => {
        navigator.clipboard.writeText(text).then(() => {
            confirmationMessage.textContent = message;
            confirmationMessage.classList.remove("d-none");
            setTimeout(() => confirmationMessage.classList.add("d-none"), 3000);
        });
    };

    document.getElementById("reset-form").addEventListener("click", resetForm);

    document.getElementById("generate-prompt").addEventListener("click", () => {
        const activeTab = document.querySelector(".tab-pane.active");
        const formId = activeTab.querySelector("form").id;
        const prompt = generatePrompt(formId);
        updatePromptInUI(prompt);
        copyToClipboard(prompt, "Prompt generated and copied!");
    });

    document.getElementById("random-choices").addEventListener("click", () => {
        const activeTab = document.querySelector(".tab-pane.active");
        const formId = activeTab.querySelector("form").id;
        selectRandomChoicesWithWeights(formId);
        const prompt = generatePrompt(formId);
        updatePromptInUI(prompt);
        copyToClipboard(prompt, "Random choices selected and copied!");
    });

    document.getElementById("generate-multiple").addEventListener("click", () => {
        const activeTab = document.querySelector(".tab-pane.active");
        const formId = activeTab.querySelector("form").id;
        const prompts = generateMultiplePromptsWithWeights(formId);
        copyToClipboard(prompts, "10 weighted prompts generated and copied!");
    });

    toggleNightModeButton.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });

    loadQuestions();
});
