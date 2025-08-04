# Translations documentation

Sweet spot är runt 10 språk. mer än det så kan det faila..
vid 10st så ser det bra ut men några av de transatlions files som ser ut att de skrivs sparas inte??? nollställs..

##Kan använda detta för att lägga till flera språk senare::

Follow these steps to add new language translations for these languages:[]

1. **Generate Translation Files**:

   ```
   node translation_workflow.js add [PROJECT_DIR] [COMMA_SEPERATED_LANGUAGE_CODES]
   ```

   This will create a translation file for every new language ([PROJECT_DIR]/js/translations_fr.js etc.). It will have the same structure as the default English translation in /js/translations_en.js.

2. **Manual Translation**:
   Go through each new translation file and add translations.
   **Requirements**:
   - Maintain exact structure - only fill in the empty strings, don't change field names or object structure.
   - Keep brand names, location names.
   - Ensure translations sound natural, appropriate and easy to understand rather than literal translations word for word.
3. Run this command in root directory: node post_build.js [PROJECT_DIR].
4. Open the [PROJECT_DIR]/index.html in the browser.

##Eller denna för att fixa translations som inte kunde komma med pga för för mågna språk:

Fix the missing translations in the translations files.
Run post_build.js to see which ones have empty strings.
Go through each translation file with empty strings and add translations based on the english defaults in translations_en.js
Final step: run node translation_workflow.js clean [PROJECT_DIR]
