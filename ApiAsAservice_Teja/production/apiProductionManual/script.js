// Add this function to send API data to your server
async function sendApiDataToServer(apiRequestData) {
    try {
        const response = await fetch('http://localhost:3000/api/storeApiRequest/Api_Specified_Automated_TestCases/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiRequestData), // Include testCaseNumber and testCaseName
        });
        if (response.ok) {
            console.log('API request data sent to server successfully.');
        } else {
            console.error('Error sending API request data to server.');
        }
    } catch (error) {
        console.error('An error occurred while sending API request data:', error);
    }
}
document.addEventListener("DOMContentLoaded", function () {
    const validateButton = document.querySelector(".custom-button-validate");
    const downloadButton = document.querySelector("#download-all-data"); // Select the download button
    const requestTypeSelect = document.querySelector(".custom-select");
    const endpointInput = document.querySelector(".custom-input#end-point");
    const headersInput = document.querySelector(".custom-textarea#headers");
    const bodyInput = document.querySelector(".custom-textarea#body");
    const invalidInput = document.querySelector("#invalid-input");
    const removeKeysInput = document.querySelector("#remove-keys-input");
    const removeKeyValueInput = document.querySelector("#remove-key-value-input");
    // Initialize apiResults array
    let apiResults = [];
    // Function to download JSON formatted API results
    function downloadJSONResults() {
        const jsonData = JSON.stringify(apiResults, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "api_results.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    // Add an event listener to the request type selector
    requestTypeSelect.addEventListener("change", function () {
        if (requestTypeSelect.value === "GET") {
            // If the request type is GET, disable the "Body" field
            bodyInput.disabled = true;
            bodyInput.value = ""; // Clear the value
        } else {
            // If the request type is not GET, enable the "Body" field
            bodyInput.disabled = false;
        }
    });
    validateButton.addEventListener("click", async () => {
        // Clear apiResults array before processing new requests
        apiResults = [];
        const requestType = requestTypeSelect.value;
        const endpoint = endpointInput.value.trim();
        const headers = headersInput.value.trim();
        const body = bodyInput.value.trim();
        const invalidKeys = invalidInput.value.trim();
        const removeKeys = removeKeysInput.value.trim();
        const removeKeyValuePairs = removeKeyValueInput.value.trim();
        // Validate required fields
        if (!requestType || !endpoint) {
            alert("Please fill in all the required fields.");
            return;
        }
        // Validate JSON format for headers
        if (headers && !isValidJson(headers)) {
            alert("Invalid JSON data in Headers. Please enter valid JSON.");
            return;
        }
        // Validate JSON format for body
        if (body && !isValidJson(body)) {
            alert("Invalid JSON data in body. Please enter valid JSON.");
            return;
        }
        // Make the body validation optional for GET, DELETE, and UPDATE requests
        if ((requestType === "GET" || requestType === "GET" || requestType === "DELETE" || requestType === "UPDATE") && body && !isValidJson(body)) {
        alert("Invalid JSON data in Body. Please enter valid JSON or leave it empty.");
        return;
         }
        try {
            clearResponses();
            const originalRequestBody = body ? JSON.parse(body) : {};
            displayRequestBody("Main Request Body", JSON.stringify(originalRequestBody, null, 2));
            const actualResponse = await executeApiRequest(requestType, endpoint, headers, body);
            displayResponse("Actual Use Case Response", actualResponse);
            document.querySelector(".custom-results").appendChild(document.createElement("hr"));
            const selectedTestCases = [];
            // Insert API request and response data into MongoDB
            await sendApiDataToServer({
                requestType,
                endpoint,
                headers,
                body,
                actualResponse,
            });
            console.log(sendApiDataToServer)
            // Function to generate a modified request body based on the provided keys
            function generateModifiedRequestBody(data, keysToRemove, keysToInvalidate, customInvalidValue, removeEntirePair) {
                if (typeof data !== 'object' || data === null) {
                    return data;
                }
                if (Array.isArray(data)) {
                    return data.map((item) => generateModifiedRequestBody(item, keysToRemove, keysToInvalidate, removeEntirePair));
                }
                const modifiedBody = { ...data };
                for (const key in modifiedBody) {
                    if (keysToRemove.includes(key)) {
                        if (removeEntirePair) {
                            delete modifiedBody[key];
                        } else {
                            modifiedBody[key] = "";
                        }
                    } else if (keysToInvalidate.includes(key)) {
                         modifiedBody[key] = customInvalidValue; // Use custom invalid value here
                    } else {
//                        modifiedBody[key] = generateModifiedRequestBody(modifiedBody[key], keysToRemove, keysToInvalidate, removeEntirePair);
                        modifiedBody[key] = generateModifiedRequestBody(modifiedBody[key], keysToRemove, keysToInvalidate, customInvalidValue, removeEntirePair);
                    }
                }
                return modifiedBody;
            }
            function validateKeys(keys, data) {
                const validKeys = [];
                function searchKeys(obj, currentPath) {
                    for (const key in obj) {
                        const path = currentPath ? `${currentPath}.${key}` : key;
                        if (keys.includes(path)) {
                            validKeys.push(path);
                        }
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            searchKeys(obj[key], path);
                        }
                    }
                }
                searchKeys(data, '');
                return validKeys;
            }



            // Validate keys present in the original request body
            function validateKeysExistence(keys, data) {
                const keysExist = keys.split(',').map(key => key.trim()).every(key => doesKeyExist(key, data));
                return keysExist;
            }

            function doesKeyExist(key, data) {
                if (typeof data !== 'object' || data === null) {
                    return false;
                }
                if (key in data) {
                    return true;
                }
                for (const k in data) {
                    if (doesKeyExist(key, data[k])) {
                        return true;
                    }
                }
                return false;
            }

            if (removeKeys) {
                const keysToRemove = removeKeys.split(',').map(key => key.trim());
                const validKeysToRemove = keysToRemove.filter(key => doesKeyExist(key, originalRequestBody));
                for (const key of validKeysToRemove) {
                    const modifiedBody = generateModifiedRequestBody(originalRequestBody, [key], [], false);
                    selectedTestCases.push([`Remove Key "${key}"`, modifiedBody]);
                }
            }

            if (invalidKeys) {
                const keysToInvalidate = invalidKeys.split(',').map(key => key.trim());
                const validKeysToInvalidate = keysToInvalidate.filter(key => doesKeyExist(key, originalRequestBody));
                for (const key of validKeysToInvalidate) {
                    const customInvalidValuesInput = document.querySelector("#custom-invalid-values");
                    const customInvalidValue = customInvalidValuesInput.value.trim() || "###";
                    const modifiedBody = generateModifiedRequestBody(originalRequestBody, [], [key], customInvalidValue);
                    selectedTestCases.push([`Invalid Key "${key}"`, modifiedBody]);
                }
            }

            if (removeKeyValuePairs) {
                const keysToRemovePairs = removeKeyValuePairs.split(',').map(key => key.trim());
                const validKeysToRemovePairs = keysToRemovePairs.filter(key => doesKeyExist(key, originalRequestBody));
                for (const key of validKeysToRemovePairs) {
                    const modifiedBody = generateModifiedRequestBody(originalRequestBody, [key], [], true);
                    selectedTestCases.push([`Remove Key-Value Pair for Key "${key}"`, modifiedBody]);
                }
            }



//
//            if (removeKeys) {
//                const keysToRemove = removeKeys.split(',').map(key => key.trim());
//                for (const key of keysToRemove) {
//                    const modifiedBody = generateModifiedRequestBody(originalRequestBody, [key], [], false);
//                    selectedTestCases.push([`Remove Key "${key}"`, modifiedBody]);
//                }
//            }
//            if (invalidKeys) {
//                const keysToInvalidate = invalidKeys.split(',').map(key => key.trim());
//                const customInvalidValuesInput = document.querySelector("#custom-invalid-values");
//                const customInvalidValue = customInvalidValuesInput.value.trim() || "###"; // Get value from textbox or default to "###"
//                for (const key of keysToInvalidate) {
//                    const modifiedBody = generateModifiedRequestBody(originalRequestBody, [], [key], customInvalidValue);
//                    selectedTestCases.push([`Invalid Key "${key}"`, modifiedBody]);
//                }
//            }
//            if (removeKeyValuePairs) {
//                const keysToRemove = removeKeyValuePairs.split(',').map(key => key.trim());
//                for (const key of keysToRemove) {
//                    const modifiedBody = generateModifiedRequestBody(originalRequestBody, [key], [], true);
//                    selectedTestCases.push([`Remove Key-Value Pair for Key "${key}"`,modifiedBody]);
//                }
//            }
            // Log the test case number and name before sending to the server
//            console.log("Test Case Number:", i + 1);
//            console.log("Test Case Name:", testcaseName);
            // ...
            // ...
            // Execute each selected test case and display the request body, response, and test case number in the UI
            for (let i = 0; i < selectedTestCases.length; i++) {
                const [testcaseName, modifiedBody] = selectedTestCases[i];
                // Display the test case number
                displayTestCaseNumber(i + 1, selectedTestCases.length);
                // Create a div to display the test case name
                const testcaseDiv = document.createElement("div");
                testcaseDiv.classList.add("test-case");
                testcaseDiv.innerHTML = `<h4>${testcaseName}</h4>`;
                document.querySelector(".custom-results").appendChild(testcaseDiv);
                // Display the modified request body
                displayRequestBody("Request Body", JSON.stringify(modifiedBody, null, 2));
                // Execute the API request with the modified body
                let testCaseResponse;
                if (modifiedBody !== originalRequestBody) {
                    testCaseResponse = await executeApiRequest(requestType, endpoint, headers, JSON.stringify(modifiedBody));
                } else {
                    // If modifiedBody is the same as originalRequestBody, set a message
                    testCaseResponse = "No valid keys to process.";
                }
                // Display the API response
                displayResponse("Response", testCaseResponse);
                // Insert API request and response data into MongoDB
                await sendApiDataToServer({
                    requestType,
                    endpoint,
                    headers,
                    body: JSON.stringify(modifiedBody), // Sending modified body instead of original
                    response: testCaseResponse, // Sending the specific response data
                    testCaseName: testcaseName,
                });
                console.log(testCaseResponse)
                // Insert API request and response data into apiResults array
                apiResults.push({
                    testCaseNumber: i + 1,  // Test case number
                    testCaseName: testcaseName,
                    requestType,
                    endpoint,
                    headers,
                    Body: JSON.parse(JSON.stringify(modifiedBody)), // Store as an object
                    Response: JSON.parse(testCaseResponse), // Store as an object
                });
                // Add a small gap and a line of underscores after each response
                document.querySelector(".custom-results").appendChild(document.createElement("hr"));
            // Check if there are API results on the screen
            const resultsExist = document.querySelector(".custom-results").children.length > 0;
            // Show the download button if results exist
            downloadButton.style.display = resultsExist ? "block" : "none";
            }
        } catch (error) {
            console.error("An error occurred during the API request:", error);
        }
    });
      // Function to handle downloading JSON results
    downloadButton.addEventListener("click", function () {
        // Create a new Blob with current apiResults
        const jsonData = JSON.stringify(apiResults, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        // Create a unique URL for the Blob
        const url = URL.createObjectURL(blob);
        // Create an <a> element to trigger the download
        const a = document.createElement("a");
        a.href = url;
        a.download = `api_results_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        // Clean up by removing the <a> element and revoking the URL
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    // Function to clear previous responses
    function clearResponses() {
        const apiResponsesDiv = document.querySelector(".custom-results");
        while (apiResponsesDiv.firstChild) {
            apiResponsesDiv.removeChild(apiResponsesDiv.firstChild);
        }
    }
    // Function to display the test case number
    function displayTestCaseNumber(current, total) {
        console.log("Displaying Test Case Number:", current);
        const apiResponsesDiv = document.querySelector(".custom-results");
        const testcaseNumberDiv = document.createElement("div");
        testcaseNumberDiv.classList.add("test-case-number");
        testcaseNumberDiv.textContent = `Test Case ${current}/${total}`;
        apiResponsesDiv.appendChild(testcaseNumberDiv);
    }
    // Function to display the request body
    function displayRequestBody(title, body) {
        const apiResponsesDiv = document.querySelector(".custom-results");
        const requestBodyDiv = document.createElement("div");
        requestBodyDiv.classList.add("request-body");
        requestBodyDiv.innerHTML = `<h4>${title}:</h4><pre>${body}</pre>`;
        apiResponsesDiv.appendChild(requestBodyDiv);
    }
    // Function to display the API response
    function displayResponse(title, responseText) {
        const apiResponsesDiv = document.querySelector(".custom-results");
        const responseDiv = document.createElement("div");
        responseDiv.classList.add("response");
        responseDiv.innerHTML = `<h4>${title}:</h4><pre>${responseText}</pre>`;
        apiResponsesDiv.appendChild(responseDiv);
    }
    // Function to validate JSON format
    function isValidJson(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (error) {
            return false;
        }
    }
    // Function to execute API request
    async function executeApiRequest(requestType, endpoint, headers, requestBody) {
        try {
            let responseText;
            // Implement API requests based on requestType (POST, GET, etc.)
            // Use fetch or XMLHttpRequest to make requests
            // Example using fetch for a POST request
            if (requestType === "POST") {
                const parsedHeaders = headers ? JSON.parse(headers) : {};
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: parsedHeaders, // Assuming headers is a valid JSON string
                    body: requestBody, // Assuming requestBody is a valid JSON string
                });
                responseText = await response.text();
            }
            // Example using fetch for a GET request
            if (requestType === "GET") {
                const parsedHeaders = headers ? JSON.parse(headers) : {};
                const response = await fetch(endpoint, {
                    method: "GET",
                    headers: parsedHeaders, // Assuming headers is a valid JSON string
                });
                responseText = await response.text();
            }
            // Example using fetch for a UPDATE request
            if (requestType === "UPDATE") {
                const parsedHeaders = headers ? JSON.parse(headers) : {};
                const response = await fetch(endpoint, {
                    method: "UPDATE",
                    headers: parsedHeaders, // Assuming headers is a valid JSON string
                    body: requestBody, // Assuming requestBody is a valid JSON string
                });
                responseText = await response.text();
            }
            // Example using fetch for a DELETE request
            if (requestType === "DELETE") {
                const parsedHeaders = headers ? JSON.parse(headers) : {};
                const response = await fetch(endpoint, {
                    method: "DELETE",
                    headers: parsedHeaders, // Assuming headers is a valid JSON string
                    body: requestBody, // Assuming requestBody is a valid JSON string
                });
                responseText = await response.text();
            }
            return responseText;
        } catch (error) {
            console.error("An error occurred during the API request:", error);
            return "Error occurred during the API request";
        }
    }
});