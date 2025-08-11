let prompt = document.querySelector("#prompt")
let submitbtn = document.querySelector("#submit")
let chatContainer = document.querySelector(".chat-container")
let imagebtn = document.querySelector("#image")
let image = document.querySelector("#image img")
let imageinput = document.querySelector("#image input")

const API_KEY = 'AIzaSyD6LXPu5OhQbNsWBRqKpVKzLxuP8pEf9z8'; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;



let user = {
    message : null,
    file : {
        mime_type : null,
        data : null
    }
}

async function  genrateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");

    // STEP 1: Show Gemini loading message
    text.innerHTML = `
        <img src="img/loadnew.gif" alt="loading" class="load" height="50px" width="40px" style="vertical-align:middle; margin-right:5px;">
        <span style="color:gray;">⏳Generating intelligent response via Gemini API...</span>
    `;

    // 🛠️ FIX: Create flat `parts` array based on user.file.data
    let parts = [
    {
        "text": `Only give direct SQL command with no explanation or variations. Use standard PostgreSQL. User said: ${user.message}`
    }
    ];


    const nonSqlPhrases = ["hello", "hi", "who are you", "how are you", "what is your name"];
    const lowerMsg = user.message.trim().toLowerCase();

    if (nonSqlPhrases.includes(lowerMsg)) {
        text.innerHTML = `
            👋 Welcome! I’m your SQL Assistant Bot.<br/>
            💡 You can ask me to perform database operations such as:<br/>
            • Create a table<br/>
            • Insert employee data<br/>
            • Display all records
        `;
        return;
    }


    if (user.file && user.file.data) {
        parts.push({
            inline_data: user.file
        });
    }

    let RequestOption = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "contents": [
                {
                    "parts": parts
                }
            ]
        })
    };

    try {
        let response = await fetch(API_URL, RequestOption);
        let data = await response.json();
        console.log(data);

        // ✅ Added safe check to avoid error if no candidates
        let apiResponse = "";

        if (
            data &&
            data.candidates &&
            data.candidates.length > 0 &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0 &&
            data.candidates[0].content.parts[0].text
        ) {
            apiResponse = data.candidates[0].content.parts[0].text
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/```sql|```/gi, '')
                .trim();
        } else {
            text.innerHTML = `
                ⚠️ Gemini did not return a valid SQL response.<br><br>
                💡 Please try rephrasing your query. This chatbot is trained to understand SQL-related questions only.
            `;
            return;
        }

        text.innerHTML = `
            <img src="img/loadnew.gif" alt="loading" class="load" height="50px" width="40px"" style="vertical-align:middle; margin-right:5px;">
            <span style="color:gray;">📡 Trying executing query on Database...</span>
        `;


        if (/^(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|USE|SELECT|\\dt)/i.test(apiResponse)) {
    try {
        const sqlResponse = await fetch("http://localhost:5000/execute-sql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ sql: apiResponse })
        });

        const result = await sqlResponse.json();

        // Special handling for \dt command
        if (apiResponse.trim().toLowerCase() === '\\dt') {
                if (result.result && result.result.length > 0) {
                    const tablesList = result.result.map(row => `<li>${row.table_name}</li>`).join("");
                    apiResponse = `
                        <div class="sql-output">
                            <div class="query-section">
                                📄 <strong>Command used:</strong><br>
                                <code>\\dt</code>
                            </div>
                            <div class="status-section">
                                <strong>Status:</strong> ✅ Retrieved table list.
                            </div>
                            <div class="table-section">
                                <ul>${tablesList}</ul>
                            </div>
                        </div>
                    `;
                } else {
                    apiResponse = `
                        <div class="sql-output">
                            <div class="query-section">
                                📄 <strong>Command used:</strong><br>
                                <code>\\dt</code>
                            </div>
                            <div class="status-section">
                                <strong>Status:</strong> ⚠️ No tables found.
                            </div>
                        </div>
                    `;
                }

            } else if (result.result && result.result.length > 0) {
                // Existing table rendering for normal SELECT queries
                const headers = Object.keys(result.result[0]);
                const headerRow = headers.map(h => `<th>${h}</th>`).join("");
                const bodyRows = result.result.map(row => {
                    const cells = headers.map(h => `<td>${row[h]}</td>`).join("");
                    return `<tr>${cells}</tr>`;
                }).join("");

                const table = `
                    <div class="sql-output">
                        <div class="query-section">
                            📄 <strong>Query used:</strong><br>
                            <code>${apiResponse}</code>
                        </div>
                        <div class="status-section">
                            <strong>Status:</strong> ✅ Query executed successfully.
                        </div>
                        <div class="table-section">
                            <table class="styled-table">
                                <thead><tr>${headerRow}</tr></thead>
                                <tbody>${bodyRows}</tbody>
                            </table>
                        </div>
                    </div>
                `;
                apiResponse = table;

            } else {
                // Fallback for other commands
                apiResponse = `
                    <div class="sql-output">
                        <div class="query-section">
                            📄 <strong>Query used:</strong><br>
                            <code>${apiResponse}</code>
                        </div>
                        <div class="status-section">
                            <strong>Status:</strong> ${result.message || 'Executed successfully.'}
                        </div>
                    </div>
                `;
            }

        } catch (err) {
            console.error('SQL Execution Error:', err);
            apiResponse += `<br><br>🔴 <strong>Server Error:</strong> Failed to execute SQL.`;
        }
    }


        console.log(apiResponse);
        text.innerHTML = apiResponse;
    } catch (error) {
        console.log(error);
        text.innerHTML = `
            ⚠️ Gemini API is currently unavailable or has hit its usage limit.<br>
            🤖 You can still say hello!<br><br>
            <strong>Hint:</strong> Please ask something like: <em>"Create a table"</em> or <em>"Insert a record"</em>.
        `;

    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
        image.src = `img/img.svg`;
        image.classList.remove("choose");
        user.file = {};
    }
}



function createChatBox(html, classes){
    let div = document.createElement("div")
        div.innerHTML= html
        div.classList.add(classes)
        return div    
}

function handlechatResponse(userMessage){
    user.message = userMessage
    let html = `<img src="img/boyz.png" alt="" id="userImage" width="8.5%">
            <div class="user-chat-area">
                ${user.message}
                ${user.file.data?`<img src = "data:${user.file.mime_type};base64, ${user.file.data}" class = "chooseimg" />` : ""}
            </div> `
    prompt.value = ""
    
    let userChatBox = createChatBox(html, "user-chat-box")
    chatContainer.appendChild(userChatBox)

    chatContainer.scrollTo({top:chatContainer.scrollHeight, behavior:"smooth"})

    setTimeout(() =>{
        let html = `<img src="img/aiupimg.png" alt="" id="aiImage"  width="6%">
            <div class="ai-chat-area">
            <img src="img/loadnew.gif" alt="" class="load", width="50px">
            </div> `

        let aiChatBox = createChatBox(html, "ai-chat-box")
        chatContainer.appendChild(aiChatBox)
        genrateResponse(aiChatBox);
    },600)

    

}

prompt.addEventListener("keydown", (e)=>{
    if(e.key == "Enter"){
        handlechatResponse(prompt.value);
    }
})   

submitbtn.addEventListener("click", ()=>{
    handlechatResponse(prompt.value);
})

imageinput.addEventListener("change", ()=>{
    const file = imageinput.files[0]
    if(!file) return 
    let reader = new FileReader()
    reader.onload = (e)=>{
        let base64string = e.target.result.split(",")[1]
        user.file={
            mime_type : file.type,
            data : base64string
        }
        image.src = `data:${user.file.mime_type};base64, ${user.file.data}`
        image.classList.add("choose")
    }

    
    reader.readAsDataURL(file)
})

imagebtn.addEventListener("click", ()=>{
    imagebtn.querySelector("input").click()
}) 





