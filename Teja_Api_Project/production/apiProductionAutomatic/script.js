// function to send API data to your server
async function sendApiDataToServer(apiRequestData) {
    try {
        const response = await fetch('http://localhost:3000/api/storeApiRequest/Api_All_Automated_TestCases', {
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


    // Select the checkboxes
    const generateEmptyValuesCheckbox = document.getElementById("generateEmptyValuesCheckbox");
    const generateInvalidValuesCheckbox = document.getElementById("generateInvalidValuesCheckbox");
    const generateRemoveKeyValuesCheckbox = document.getElementById("generateRemoveKeyValuesCheckbox");





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
        try {
            // Clear previous responses
            clearResponses();

            // Parse the original request body
            const originalRequestBody = body ? JSON.parse(body) : {};

            // Display the main request body data
            displayRequestBody("Main Request Body", JSON.stringify(originalRequestBody, null, 2));
            const actualResponse = await executeApiRequest(requestType, endpoint, headers, body);
            displayResponse("Actual Use Case Response", actualResponse);
            document.querySelector(".custom-results").appendChild(document.createElement("hr"));

            // Generate test cases
            const emptyValuesTestcases = generateEmptyValuesTestcases(originalRequestBody);
            const invalidValuesTestcases = generateInvalidValuesTestcases(originalRequestBody);
            const removeKeyValuesTestcases = generateRemoveKeyValuesTestcases(originalRequestBody);

            // Combine all test cases
//            const allTestcases = [...emptyValuesTestcases, ...invalidValuesTestcases, ...removeKeyValuesTestcases];

            // Instead of testcasesToExecute, use selectedTestcases
            const selectedTestcases = [];

            if (generateEmptyValuesCheckbox.checked) {
                selectedTestcases.push(generateEmptyValuesTestcases(originalRequestBody));
            }

            if (generateInvalidValuesCheckbox.checked) {
                const customInvalidValue = customInvalidValueInput.value;
                selectedTestcases.push(generateInvalidValuesTestcases(originalRequestBody, customInvalidValue));
            }

            if (generateRemoveKeyValuesCheckbox.checked) {
                selectedTestcases.push(generateRemoveKeyValuesTestcases(originalRequestBody));
            }

            const selectedTestcasesToExecute = selectedTestcases.reduce((acc, val) => acc.concat(val), []);
            // Execute each test case and display the request body, response, and test case number in the UI
            const totalSelectedTestcases = selectedTestcasesToExecute.length; // Calculate the total number of selected test cases


            // Execute each test case and display the request body, response, and test case number in the UI
            for (let i = 0; i < selectedTestcasesToExecute.length; i++) {
                const [testcaseName, modifiedBody] = selectedTestcasesToExecute[i];

                // Validate and skip replacing empty or invalid values for email, gmail, and username
                const validatedModifiedBody = validateAndSkipKeysReplacement(modifiedBody);

                // Display the test case number
                displayTestCaseNumber(i + 1, totalSelectedTestcases);

                // Create a div to display the test case name
                const testcaseDiv = document.createElement("div");
                testcaseDiv.classList.add("test-case");
                testcaseDiv.innerHTML = `<h4>${testcaseName}</h4>`;
                document.querySelector(".custom-results").appendChild(testcaseDiv);

                // Display the modified request body
                displayRequestBody("Request Body", JSON.stringify(validatedModifiedBody, null, 2));

                // Execute the API request with the modified body
                const response = await executeApiRequest(requestType, endpoint, headers, JSON.stringify(validatedModifiedBody));

                // Display the API response
                displayResponse("Response", response);

                // Add a small gap and a line of underscores after each response
                document.querySelector(".custom-results").appendChild(document.createElement("hr"));


                // Insert API request and response data into apiResults array
                apiResults.push({
                    testCaseNumber: i + 1,  // Test case number
                    testCaseName: testcaseName,
                    requestType,
                    endpoint,
                    headers,
                    Body: JSON.parse(JSON.stringify(originalRequestBody)), // Store as an object
                    Response: JSON.parse(response), // Store as an object
                });

//                console.log(response)


                // Insert API request and response data into MongoDB, including testCaseNumber and testCaseName
                await sendApiDataToServer({
                    requestType,
                    endpoint,
                    headers,
                    body,
                    response,
//                    testCaseNumber: i + 1,  // Test case number
                    testCaseName: testcaseName,  // Test case name
                });



            // Check if there are API results on the screen
            const resultsExist = document.querySelector(".custom-results").children.length > 0;

            // Show the download button if results exist
            downloadButton.style.display = resultsExist ? "block" : "none";


            }
        } catch (error) {
            console.error("An error occurred during the API request:", error);
        }
    });


    //    // Function to handle downloading JSON results
//    downloadButton.addEventListener("click", function () {
//        // Function to download results (downloadJSONResults)
//        downloadJSONResults();
//    });

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

    // Function to validate and skip replacing empty or invalid values for specific keys
    function validateAndSkipKeysReplacement(data) {
        const emailKeys = ["email", "gmail", "username"]; // Add other keys as needed

        function traverseAndSkip(data) {
            if (typeof data === "object") {
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        if (typeof data[key] === "object") {
                            traverseAndSkip(data[key]);
                        } else if (emailKeys.includes(key.toLowerCase())) {
                            // Skip replacement if the value is empty or "###"
                            if (data[key] !== "" && data[key] !== "###") {
                                data[key] = generateUniqueEmail();
                            }
                        }
                    }
                }
            }
        }

        const newData = JSON.parse(JSON.stringify(data)); // Clone the data
        traverseAndSkip(newData);

        return newData;
    }

    // Function to generate test cases for empty values
    function generateEmptyValuesTestcases(data) {
        const testcases = [];

        function traverseObject(obj, path = []) {
            for (const key in obj) {
                if (typeof obj[key] === "object") {
                    traverseObject(obj[key], path.concat(key));
                } else {
                    const modifiedData = JSON.parse(JSON.stringify(data));
                    let currentObj = modifiedData;
                    for (const pathKey of path) {
                        currentObj = currentObj[pathKey];
                    }
                    currentObj[key] = "";
                    const testcaseName = `Empty Value - ${path.concat(key).join(".")}`;
                    testcases.push([testcaseName, modifiedData]);
                }
            }
        }

        traverseObject(data);
        return testcases;
    }




    // Find the input field for the custom invalid value
    const customInvalidValueInput = document.getElementById("customInvalidValue");
//    const generateInvalidValuesCheckbox = document.getElementById("generateInvalidValuesCheckbox");

    // Function to handle the checkbox change event
    generateInvalidValuesCheckbox.addEventListener("change", function() {
        // Enable/disable the custom invalid value input based on checkbox status
        customInvalidValueInput.disabled = !this.checked;

        // If checkbox is unchecked, hide the text box; otherwise, show it
        if (!this.checked) {
            customInvalidValueInput.style.display = 'none';
        } else {
            customInvalidValueInput.style.display = 'block'; // or 'initial'
        }

        // Make the input required only if the checkbox is checked
        customInvalidValueInput.required = this.checked;
    });



    // Inside the validateButton click event listener, replace '###' with custom value
    if (generateInvalidValuesCheckbox.checked) {
        const customInvalidValue = customInvalidValueInput.value;
        selectedTestcases.push(generateInvalidValuesTestcases(originalRequestBody, customInvalidValue));
    }



    // Function to generate test cases for invalid values
    function generateInvalidValuesTestcases(data, customValue) {
        const testcases = [];

        function traverseObject(obj, path = []) {
            for (const key in obj) {
                if (typeof obj[key] === "object") {
                    traverseObject(obj[key], path.concat(key));
                } else {
                    const modifiedData = JSON.parse(JSON.stringify(data));
                    let currentObj = modifiedData;
                    for (const pathKey of path) {
                        currentObj = currentObj[pathKey];
                    }
                    currentObj[key] = customValue || "###"; // Use custom value if provided, else use '###'
                    const testcaseName = `Invalid Value - ${path.concat(key).join(".")}`;
                    testcases.push([testcaseName, modifiedData]);
                }
            }
        }

        traverseObject(data);
        return testcases;
    }

    // Function to generate test cases for removing key-value pairs
    function generateRemoveKeyValuesTestcases(data) {
        const testcases = [];

        function traverseObject(obj, path = []) {
            for (const key in obj) {
                if (typeof obj[key] === "object") {
                    traverseObject(obj[key], path.concat(key));
                } else {
                    const modifiedData = JSON.parse(JSON.stringify(data));
                    let currentObj = modifiedData;
                    for (const pathKey of path) {
                        currentObj = currentObj[pathKey];
                    }
                    delete currentObj[key];
                    const testcaseName = `Remove Key-Value - ${path.concat(key).join(".")}`;
                    testcases.push([testcaseName, modifiedData]);
                }
            }
        }

        traverseObject(data);
        return testcases;
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

    // Function to generate a unique email address
    function generateUniqueEmail() {
        const uniqueId = Date.now(); // Use a unique identifier
        return `unique${uniqueId}@gmail.com`;
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

