document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const pasteBtn = document.getElementById('paste-btn');
    const copyBtn = document.getElementById('copy-btn');
    const filterBtn = document.getElementById('filter-btn');
    const toast = document.getElementById('toast');

    let toastTimeout;

    // Show Toast Notification
    const showToast = (message, isError = false) => {
        toast.textContent = message;
        toast.style.borderColor = isError ? '#ff4444' : 'var(--accent)';
        toast.style.color = isError ? '#ff4444' : 'var(--accent)';
        toast.classList.remove('hidden');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    };

    // Paste from Clipboard
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            showToast('DATA_PASTED');
            
            // Auto-filter on paste if user desires (optional, but let's keep it manual per specs to allow viewing)
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            showToast('ERR: CLIPBOARD_ACCESS_DENIED', true);
        }
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', async () => {
        if (!outputText.value.trim()) {
            showToast('ERR: NOTHING_TO_COPY', true);
            return;
        }
        
        try {
            await navigator.clipboard.writeText(outputText.value);
            showToast('OUTPUT_COPIED');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast('ERR: COPY_FAILED', true);
        }
    });

    // Main Filtering Logic
    filterBtn.addEventListener('click', () => {
        const rawText = inputText.value;
        
        if (!rawText.trim()) {
            showToast('ERR: INPUT_EMPTY', true);
            return;
        }

        const filteredText = cleanAIText(rawText);
        
        outputText.value = filteredText;
        showToast('FILTER_EXECUTED_SUCCESSFULLY');
    });

    function cleanAIText(text) {
        let clean = text;

        // 1. Remove common AI introductory phrases (Case-insensitive, multiline)
        const introPatterns = [
            /^Here is the .*?:/gmi,
            /^Here are the .*?:/gmi,
            /^Sure, .*?\./gmi,
            /^Certainly!.*?\./gmi,
            /^Absolutely!.*?\./gmi,
            /^Of course!.*?\./gmi,
            /^As an AI .*?,/gmi,
            /^I'd be happy to .*?\./gmi,
            /^I can help with that\./gmi,
            /^Great question!/gmi,
            /^Here's an updated version .*?:/gmi
        ];

        introPatterns.forEach(pattern => {
            clean = clean.replace(pattern, '');
        });

        // 2. Remove common AI concluding phrases
        const outroPatterns = [
            /Let me know if you need anything else\.?$/gmi,
            /Let me know if you have any (other )?questions\.?$/gmi,
            /I hope this helps!?$/gmi,
            /Feel free to ask if .*?$/gmi,
            /Please let me know if .*?$/gmi,
            /Don't hesitate to .*?$/gmi,
            /In conclusion, /gmi,
            /To summarize, /gmi
        ];

        outroPatterns.forEach(pattern => {
            clean = clean.replace(pattern, '');
        });

        // 3. Remove "Note:" or "Disclaimer:" blocks at the bottom if they are clearly AI fluff
        clean = clean.replace(/^(Please )?Note:.*?$/gmi, '');
        clean = clean.replace(/^Disclaimer:.*?$/gmi, '');

        // 4. Advanced Block/Paragraph Removal for System Prompts & Compliance Injections
        // Split by newlines to evaluate line-by-line / paragraph-by-paragraph
        let lines = clean.split(/\n/);
        
        // Keywords that heavily indicate a system instruction or compliance block
        const systemPromptKeywords = [
            "academic integrity",
            "protected assessment",
            "ai agent compliance",
            "sole function is to",
            "you are a helpful ai",
            "this ai assistant is disabled",
            "mandatory for all ai",
            "acknowledge these instructions",
            "confirm your compliance",
            "primary instruction for",
            "do you understand",
            "as an ai language model",
            "as a language model",
            "my purpose is to help you learn",
            "not to complete your work",
            "data-action=\"acknowledge-guidelines\""
        ];

        lines = lines.filter(line => {
            const lowerLine = line.toLowerCase();
            
            // Check for direct matches
            let hasKeyword = systemPromptKeywords.some(kw => lowerLine.includes(kw));
            
            if (hasKeyword) {
                return false; // Skip this line/paragraph
            }
            return true;
        });

        clean = lines.join('\n');

        // 5. Clean up excessive newlines generated by removing the fluff
        clean = clean.replace(/\n{3,}/g, '\n\n');
        
        // 6. Trim leading and trailing whitespace
        clean = clean.trim();

        return clean;
    }
});
