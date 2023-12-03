// Add this function to send API data to your server
async function sendApiDataToServer(apiRequestData) {
    try {
        const response = await fetch('http://localhost:3000/api/storeApiRequest/Api_Validation_Automated_Multiple_TestCases/', {
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

    const customInvalidValuesInput = document.querySelector("#custom-invalid-values"); // Added this line to select the custom invalid values input

    const customInvalidValue = customInvalidValuesInput.value.trim() || "###";


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



    // Function to check if keys exist in the request body
    function checkKeysExist(keys, data) {
        const keysArray = keys.split(',').map(key => key.trim());
        const queue = [...keysArray];
        let currentData = data;

        while (queue.length > 0) {
            const currentKey = queue.shift();

            if (currentData.hasOwnProperty(currentKey)) {
                // If the key exists, check if it's an object and add its keys to the queue
                if (typeof currentData[currentKey] === 'object' && currentData[currentKey] !== null) {
                    currentData = currentData[currentKey];
                    const nestedKeys = Object.keys(currentData);
                    queue.push(...nestedKeys);
                }
            } else {
                return false; // Key doesn't exist in the request body
            }
        }

        return true; // All keys exist in the request body
    }


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
        // Define expected status values here
        const expectedStatus1 = document.querySelector("#expected-remove-keys").value;
        const expectedStatus2 = document.querySelector("#expected-invalid-keys").value;
        const expectedStatus3 = document.querySelector("#expected-remove-key-value").value;


        const customInvalidValue = document.querySelector("#custom-invalid-values").value.trim() || "###"; // Get value from textbox or default to "###"




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


            function generateModifiedRequestBody(data, keysToRemove, keysToInvalidate, removeEntirePair, customInvalidValue) {
                if (typeof data !== 'object' || data === null) {
                    return data;
                }
                if (Array.isArray(data)) {
                    return data.map((item) => generateModifiedRequestBody(item, keysToRemove, keysToInvalidate, removeEntirePair, customInvalidValue));
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
                        modifiedBody[key] = customInvalidValue || "###";
                    } else {
                        modifiedBody[key] = generateModifiedRequestBody(modifiedBody[key], keysToRemove, keysToInvalidate, removeEntirePair, customInvalidValue);
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


            // Validate keys against the originalRequestBody
            if (removeKeys && !checkKeysExist(removeKeys, originalRequestBody)) {
                alert("One or more keys in 'Remove Keys' do not exist in the request body.");
                return;
            }

            if (invalidKeys && !checkKeysExist(invalidKeys, originalRequestBody)) {
                alert("One or more keys in 'Invalid Keys' do not exist in the request body.");
                return;
            }

            if (removeKeyValuePairs && !checkKeysExist(removeKeyValuePairs, originalRequestBody)) {
                alert("One or more keys in 'Remove Key-Value Pairs' do not exist in the request body.");
                return;
            }



//            if (removeKeys) {
//                const keysToRemove = removeKeys.split(',').map(key => key.trim());
//                const validKeysToRemove = validateKeys(keysToRemove, originalRequestBody);
//                for (const key of validKeysToRemove) {
//                    const modifiedBody = generateModifiedRequestBody(originalRequestBody, [key], [], false);
//                    selectedTestCases.push([`Remove Key "${key}"`, expectedStatus1, modifiedBody]);
//                }
//            }
            if (removeKeys) {
                const keysToRemove = removeKeys.split(',').map(key => key.trim());
                const modifiedBody = generateModifiedRequestBody(originalRequestBody, keysToRemove, [], false);
                selectedTestCases.push([`Remove Key "${keysToRemove.join(', ')}"`, expectedStatus1, modifiedBody]);
            }

//            if (invalidKeys) {
//                const keysToInvalidate = invalidKeys.split(',').map(key => key.trim());
//                const modifiedBody = generateModifiedRequestBody(originalRequestBody, [], keysToInvalidate);
//                selectedTestCases.push([`Invalid Key "${keysToInvalidate.join(', ')}"`, expectedStatus2, modifiedBody]);
//
//            }

            if (invalidKeys) {
                const keysToInvalidate = invalidKeys.split(',').map(key => key.trim());
                const customInvalidValuesInput = document.querySelector("#custom-invalid-values");
                const customInvalidValue = customInvalidValuesInput.value.trim() || "###"; // Get value from textbox or default to "###"
                const modifiedBody = generateModifiedRequestBody(originalRequestBody, [], keysToInvalidate, false, customInvalidValue);
                selectedTestCases.push([`Invalid Key "${keysToInvalidate.join(', ')}"`, expectedStatus2, modifiedBody]);
            }





            if (removeKeyValuePairs) {
                const keysToRemove = removeKeyValuePairs.split(',').map(key => key.trim());
                const modifiedBody = generateModifiedRequestBody(originalRequestBody, keysToRemove, [], true);
                selectedTestCases.push([`Remove Key-Value Pair for Key "${keysToRemove.join(', ')}"`, expectedStatus3, modifiedBody]);
            }
            for (let i = 0; i < selectedTestCases.length; i++) {
                const [testcaseName, expectedStatus, modifiedBody] = selectedTestCases[i];
                displayTestCaseNumber(i + 1, selectedTestCases.length);
                const testcaseDiv = document.createElement("div");
                testcaseDiv.classList.add("test-case");
                testcaseDiv.innerHTML = `<h4>${testcaseName}</h4>`;
                document.querySelector(".custom-results").appendChild(testcaseDiv);
                displayRequestBody("Request Body", JSON.stringify(modifiedBody, null, 2));
                let status = "Skipped"; // Default status
                // Capture the test case status based on my logic
                let newResponse; // Declare newResponse outside the try-catch block
                if (expectedStatus === "") {
                    displayTestCaseStatus("Test Case Status", "Skipped");
                    status = "Skipped";
                } else {
                    try {
                        newResponse = await executeApiRequest(requestType, endpoint, headers, JSON.stringify(modifiedBody));
                        displayResponse("Response", newResponse);
                        if (newResponse.includes(expectedStatus)) {
                            displayTestCaseStatus("Test Case Status", "Passed");
                            status = "Passed";
                        } else {
                            displayTestCaseStatus("Test Case Status", "Failed");
                            status = "Failed";
                        }
                    } catch (error) {
                        console.error("An error occurred during the API request:", error);
                        displayResponse("Response", "Error occurred during the API request");
                        displayTestCaseStatus("Test Case Status", "Failed");
                        status = "Failed";
                    }
                }
                // Now, push the API response data into apiResults
                apiResults.push({
                    testCaseNumber: i + 1,
                    testCaseName: testcaseName,
                    requestType,
                    endpoint,
                    headers,
                    Body: JSON.parse(JSON.stringify(modifiedBody)),
                    Response: JSON.parse(newResponse), // Ensure newResponse is defined and parsed before using it
                    Status: status, // Update the status here
                });
                // Insert API request and response data into MongoDB
                await sendApiDataToServer({
                    requestType,
                    endpoint,
                    headers,
                    modifiedBody,
                    newResponse,
                    Status: status, // Include the updated status here
                    testCaseName: testcaseName,
                });
                console.log(sendApiDataToServer)
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

    function clearResponses() {
        const apiResponsesDiv = document.querySelector(".custom-results");
        while (apiResponsesDiv.firstChild) {
            apiResponsesDiv.removeChild(apiResponsesDiv.firstChild);
        }
    }
    function displayTestCaseNumber(current, total) {
        console.log("Displaying Test Case Number:", current);
        const apiResponsesDiv = document.querySelector(".custom-results");
        const testcaseNumberDiv = document.createElement("div");
        testcaseNumberDiv.classList.add("test-case-number");
        testcaseNumberDiv.textContent = `Test Case ${current}/${total}`;
        apiResponsesDiv.appendChild(testcaseNumberDiv);
    }
    function displayRequestBody(title, body) {
        const apiResponsesDiv = document.querySelector(".custom-results");
        const requestBodyDiv = document.createElement("div");
        requestBodyDiv.classList.add("request-body");
        requestBodyDiv.innerHTML = `<h4>${title}:</h4><pre>${body}</pre>`;
        apiResponsesDiv.appendChild(requestBodyDiv);
    }
    function displayResponse(title, responseText) {
        const apiResponsesDiv = document.querySelector(".custom-results");
        const responseDiv = document.createElement("div");
        responseDiv.classList.add("response");
        responseDiv.innerHTML = `<h4>${title}:</h4><pre>${responseText}</pre>`;
        apiResponsesDiv.appendChild(responseDiv);
    }
    function displayTestCaseStatus(title, status) {
        const apiResponsesDiv = document.querySelector(".custom-results");
        const statusDiv = document.createElement("div");
        statusDiv.classList.add("test-case-status");
        statusDiv.innerHTML = `<h4>${title}: ${status}</h4>`;
        apiResponsesDiv.appendChild(statusDiv);
    }
    function isValidJson(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (error) {
            return false;
        }
    }
    async function executeApiRequest(requestType, endpoint, headers, requestBody) {
        try {
            let responseText;
            if (requestType === "POST") {
                const parsedHeaders = headers ? JSON.parse(headers) : {};
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: parsedHeaders,
                    body: requestBody,
                });
                responseText = await response.text();
            }
            if (requestType === "GET") {
                const parsedHeaders = headers ? JSON.parse(headers) : {};
                const response = await fetch(endpoint, {
                    method: "GET",
                    headers: parsedHeaders,
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
