let allTestcases = []; // Declare allTestcases as a global variable
// Declare originalRequestBody at a higher scope
let originalRequestBody = {};

document.addEventListener("DOMContentLoaded", function () {
    const validateButton = document.querySelector(".custom-button-validate");
    const downloadButton = document.querySelector("#download-all-data"); // Select the download button
    const requestTypeSelect = document.querySelector(".custom-select");
    const endpointInput = document.querySelector(".custom-input#end-point");
    const headersInput = document.querySelector(".custom-textarea#headers");
    const bodyInput = document.querySelector(".custom-textarea#body");

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
        const selectedRequestType = requestTypeSelect.value;
        const checkboxContainer = document.querySelector('.checkbox-container');
        if (selectedRequestType === "GET") {
            // If the request type is GET, disable the "Body" field
            bodyInput.disabled = true;
            bodyInput.value = ""; // Clear the value
            // Hide the checkboxes and their names for other request types
            checkboxContainer.style.display = 'none';
        } else {
            // If the request type is not GET, enable the "Body" field
            bodyInput.disabled = false;
            // Show the checkboxes and their names for POST request type
            if (selectedRequestType === "POST") {
                checkboxContainer.style.display = 'block';
            } else {
                // Hide the checkboxes and their names for other request types
                checkboxContainer.style.display = 'none';
            }
        }
    });
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
    // Declare selectedTestcases at a higher scope
    let selectedTestcases = [];
    validateButton.addEventListener("click", async () => {

        // Clear previous responses before processing new requests
        clearResponses();

        // Clear apiResults array before processing new requests
        apiResults = [];
        const requestType = requestTypeSelect.value;
        const endpoint = endpointInput.value.trim();
        const headers = headersInput.value.trim();
        const body = bodyInput.value.trim();
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
         // Get the value from the bulk-requests-input field
        const bulkRequestsInput = document.getElementById("bulk-requests-input");
        const bulkRequestsValue = parseInt(bulkRequestsInput.value);
        // Validate if the entered value is a valid integer
        if (isNaN(bulkRequestsValue) || !Number.isInteger(bulkRequestsValue) || bulkRequestsValue <= 0) {
            alert("Please enter a valid positive integer value in the Bulk Requests field.");
            return;
        }
        try {


            const batchSize = 10; // Set the batch size for processing API requests
            const totalRequests = bulkRequestsValue; // Total number of requests

            // Parse the body input and assign it to originalRequestBody
            if (body && isValidJson(body)) {
                originalRequestBody = JSON.parse(body);
            }

            for (let i = 0; i < totalRequests; i += batchSize) {
                const originalBodyForDisplay = JSON.parse(JSON.stringify(originalRequestBody));

                const batchEnd = Math.min(i + batchSize, totalRequests);
                const batchRequests = [];

                for (let j = i; j < batchEnd; j++) {
                    const modifiedBody = replaceKeysWithUniqueEmails(originalRequestBody);

                    const requestIndex = i + j + 1;
                    const currentTestCase = `Bulk Test Case ${requestIndex}`;

                    batchRequests.push(
                        executeApiRequest(requestType, endpoint, headers, JSON.stringify(modifiedBody), requestIndex)
                    );
                }

                const batchResponses = await Promise.all(batchRequests);

                for (let j = 0; j < batchResponses.length; j++) {
                    const response = batchResponses[j];
                    const requestIndex = i + j + 1;
                    const currentTestCase = `Bulk Test Case ${requestIndex}`;
                    const modifiedBody = replaceKeysWithUniqueEmails(originalRequestBody);

                    // Display the request body
                    displayRequestBody(`Request Body - ${currentTestCase}`, JSON.stringify(modifiedBody));

                    // Display the API response
                    displayResponse(`Response ${requestIndex}`, response);

                     // Log body and response in the console
                    console.log(`Request Body - ${currentTestCase}:`, modifiedBody);
                    console.log(`Response ${requestIndex}:`, response);



                    // Insert API request and response data into apiResults array
                    apiResults.push({
                        testCaseNumber: requestIndex,
                        testCaseName: currentTestCase,
                        requestType,
                        endpoint,
                        headers,
                        Body: JSON.parse(JSON.stringify(originalBodyForDisplay)),
                        Response: JSON.parse(response),
                    });
                }
            }

            // Enable download button after all requests are processed
            downloadButton.style.display = 'inline-block'; // or 'block' depending on your layout
            downloadButton.disabled = false;


            // Rest of your code...
        } catch (error) {
            console.error("An error occurred during the API requests:", error);
        }
    });

    // Function to check if body is modified
    function isBodyModified(originalBody, modifiedBody) {
        return JSON.stringify(originalBody) !== JSON.stringify(modifiedBody);
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
    // Function to replace specific keys' values with unique email addresses
    function replaceKeysWithUniqueEmails(data) {
        const emailKeys = ["email", "gmail", "username"]; // Add other keys as needed
        const uniqueEmail = generateUniqueEmail(); // Function to generate a unique email address
        function traverseAndReplace(data) {
            if (typeof data === "object") {
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        if (typeof data[key] === "object") {
                            traverseAndReplace(data[key]);
                        } else if (emailKeys.includes(key.toLowerCase())) {
                            data[key] = uniqueEmail;
                        }
                    }
                }
            }
        }
        const newData = JSON.parse(JSON.stringify(data)); // Clone the data
        traverseAndReplace(newData);
        return newData;
    }


    // Find the input field for the custom invalid value
    const customInvalidValueInput = document.getElementById("customInvalidValue");
//    const generateInvalidValuesCheckbox = document.getElementById("generateInvalidValuesCheckbox");
    // Function to replace specific keys' values with unique email addresses
    function replaceKeysWithUniqueEmails(data) {
        const emailKeys = ["email", "gmail", "username"]; // Add other keys as needed
        const uniqueEmail = generateUniqueEmail(); // Function to generate a unique email address
        function traverseAndReplace(data) {
            if (typeof data === "object") {
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        if (typeof data[key] === "object") {
                            traverseAndReplace(data[key]);
                        } else if (emailKeys.includes(key.toLowerCase())) {
                            data[key] = uniqueEmail;
                        }
                    }
                }
            }
        }
        const newData = JSON.parse(JSON.stringify(data)); // Clone the data
        traverseAndReplace(newData);
        return newData;
    }
    // Function to generate a unique email address
    function generateUniqueEmail() {
        const uniqueId = Date.now(); // Use a unique identifier
        return `teja_unique${uniqueId}@gmail.com`; // Modify the prefix as needed
    }


//    function generateUniqueEmail() {
//        const uniqueId = Date.now(); // Use a unique identifier
//        return `unique${uniqueId}@gmail.com`;
//    }



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
