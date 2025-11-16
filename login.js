localStorage.removeItem("access");
localStorage.removeItem("refresh");
localStorage.removeItem("user_data");
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = await fetch(`${HOST}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email.value,
            password: password.value
        })
    });

    if (!res.ok) {
        document.getElementById("error").innerText = "Invalid login.";
        return;
    }

    const data = await res.json();
    setTokens(data.access, data.refresh);
    await setUserData();
    switch(getUserData().user.role){
        case "Admin":
            window.location.href = "dashboard_admin.html";
            break;
        case "Teacher":
            window.location.href = "dashboard_teacher.html";
            break;
        default:
            window.location.href = "dashboard_student.html";
            break;
    }
});