const express = require("express");
var cookieParser = require("cookie-parser");
const puppeteer = require("puppeteer"); 

const app = express();
const app_html = express();

app_html.use(express.static("styles"));

app.set("view engine", "ejs");

app.use(express.static("styles"));
app.use(cookieParser());

var db = {"admin": createSessionValue()};
var users_bio = {"admin": process.env.FLAG};
var sessions = {};
const urlEncodedParser = express.urlencoded({extended: false});
var users_answer = {"admin": []};
chat_answer = "Please, give me page name";
current_chat_admin = "admin";

// let browser;
// var bot_cookie;
// (async () => {
//     browser = await puppeteer.launch({headless: true, executablePath: "/usr/bin/google-chrome", args: [`--no-sandbox`, `--headless`, `--disable-gpu`, `--disable-dev-shm-usage`]});
//     const page = await browser.newPage();
//     await page.goto('http://127.0.0.1:5000/login');
//     await page.type("#floatingInput", "admin");
//     await page.type("#floatingPassword", db["admin"]);
//     await page.click("#submitForm");
//     await page.waitForNavigation();
//     bot_cookie = await browser.cookies();
//     console.log("Bot ready");
// }) ();

function createSessionValue() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let counter = 0;
    while (counter < 30) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
      counter += 1;
    }
    return result;
}

function checkPasswordCorrect(password){
    pass_symbols = "qwertyuiopasdfghjklzxcvbnm1234567890!@#$%";
    password = password.toLowerCase();
    for(let i = 0; i < password.length; i++){
        if(pass_symbols.indexOf(password[i]) == -1){
            return false;
        }
    }
    return true;
}

function reloadAdminPassword(){
    db["admin"] = createSessionValue();
}

setInterval(reloadAdminPassword, 300000);

app.get("/", function(request, response){
    response.redirect("login");
});

app.get("/login", function(request, response){
    if(request.get("Cookie") === undefined || !(request.cookies.session in sessions)){
        response.clearCookie("session");
        response.sendFile(__dirname + "/login.html");
    }
    else{
        response.redirect("account");
    }
});

app.get("/register", function(request, response){
    if(request.get("Cookie") === undefined || !(request.cookies.session in sessions)){
        response.clearCookie("session");
        response.sendFile(__dirname + "/register.html");
    }
    else{
        if(request.cookies.session in sessions){
            response.redirect("account");
        }
    }
});

app.get("/account", async function(request, response){
    if(request.get("Cookie") === undefined || !(request.cookies.session in sessions)){
        response.clearCookie("session");
        response.redirect("login");
    }
    else{
        user_login = sessions[request.cookies.session];
        history = users_answer[user_login];
        if(user_login == "admin"){
            //user_flag = process.env.FLAG;
            history = users_answer[current_chat_admin];
        }
        response.render("account", {bio: users_bio[user_login], messages: history});
        //response.render("account", {name: user_login, ctf_flag: user_flag, admin_message: chat_answer});
        // if(user_login != "admin"){
        //     const page = await browser.newPage();
        //     await page.goto("http://127.0.0.1:5000/account");
        // }
    }
});

app.post("/api/get_user", urlEncodedParser, function(request, response){
    var user_login = request.body.login;
    var user_password = request.body.password;
    if(user_login in db){
        if(user_password == db[user_login]){
            cookie_value = createSessionValue();
            response.cookie("session", cookie_value, {httpOnly: true, sameSite: "lax"});
            sessions[cookie_value] = user_login;
            response.redirect("/account");
        }
        else{
            response.status(400).send("Incorrect password");
        }
    }
    else{
        response.status(400).send("Not such account");
    }
});

app.post("/api/create_user", urlEncodedParser, function(request, response){
    if(request.body.login in db){
        response.status(400).send("User has exist");
    }
    else if(request.body.password == request.body.repeat_password){
        if(checkPasswordCorrect(request.body.password)){
            var user_login = request.body.login;
            var user_password = request.body.password;
            var user_bio = request.body.bio;
            users_bio[user_login] = user_bio;
            db[user_login] = user_password;
            users_answer[user_login] = [];
            cookie_value = createSessionValue();
            response.cookie("session", cookie_value, {maxAge: 900000, httpOnly: true, sameSite: "lax"});
            sessions[cookie_value] = user_login;
            response.redirect("/account");
        }
        else{
            response.status(400).send("Incorrect password's syntax");
        }
    }
    else{
        response.status(400).send("Passwords don't match");
    }
});

app.get("/api/logout", function(request, response){
    user_session = request.get("Cookie").substring(8);
    delete sessions[user_session];
    response.clearCookie("session");
    response.redirect("/login");
});

app.post("/api/change-password", urlEncodedParser, function(request, response){
    if(checkPasswordCorrect(request.body.password) && request.get("Cookie") !== undefined){
        user_login = sessions[request.cookies.session];
        db[user_login] = request.body.password;
        response.status(200).send("Password was changed");
    }
    else{
        response.status(400).send("Incorrect password's syntax");
    }
});

app.post("/chat-message", urlEncodedParser, async function(request, response){
    // user_message = request.body.message;
    // user_login = sessions[request.cookies.session];
    // if(users_pages[user_login] !== undefined && users_pages[user_login][user_message] !== undefined){
    //     chat_answer = "Checked!";
    //     page_content = users_pages[user_login][user_message];
    //     const page = await browser.newPage();
    //     const res = await page.goto("http://posts.local/page?name="+user_message+"&check_user="+user_login);
    //     const result = await page.evaluate(() => {
    //         return document.documentElement.outerHTML;
    //     });
    // }
    // else{
    //     chat_answer = "Not such page(";
    // }
    // response.redirect("account");
    //var user_answer = request.body.messaage;
    //console.log(decodeURI(request.query.chat));
    try{
        chat_name = sessions[request.cookies.session];
        is_admin = 0;
        if(chat_name == "admin"){
            chat_name = request.body.user;
            is_admin = 1;
        }
        current_chat_admin = chat_name;
        message = request.body.message;
        history = users_answer[chat_name];
        if(message == "/clear"){
            history = [];
            users_answer[chat_name] = history;
            response.redirect("account");
        }
        else if(history.length > 6){
            response.status(400).send("Too much messages. Clearing chat...");
            history = [];
            users_answer[chat_name] = history;
        }
        else if(history.length <= 6){
            history.push(message);
            users_answer[chat_name] = history;
            if(is_admin == 0){
                let browser = await puppeteer.launch({headless: true, executablePath: "/usr/bin/google-chrome", args: [`--no-sandbox`, `--headless`, `--disable-gpu`, `--disable-dev-shm-usage`]});
                const page = await browser.newPage();
                page.on('dialog', async dialog => {
                    await dialog.dismiss();
                });
                await page.goto('http://127.0.0.1:5000/login');
                await page.type("#floatingInput", "admin");
                await page.type("#floatingPassword", db["admin"]);
                await page.click("#submitForm");
                await page.waitForNavigation();
                await page.goto("http://127.0.0.1:5000/account");
                await page.close();
                browser.close();
            }
            response.status(200).send("Message has been send successful");
        }
    }
    catch(error){
        history = [];
        users_answer[chat_name] = history;
        response.status(400).send("Broken... Reparing, clearing chat, please refresh page");
        //console.log("Error");
    }
});

app.listen(5000, function(){
    console.log("Listen on 5000...");
});