async function loadProfile() {
    const data = JSON.parse(localStorage.getItem("user_data"));
    document.getElementById("username").innerText = data.user.full_name
}

loadProfile();