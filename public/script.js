const form = document.getElementById("form");
const list = document.getElementById("list");

form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const data = {
        name: document.getElementById("name").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        status: document.getElementById("status").value,
        date: document.getElementById("date").value
    };

    if(!data.name || !data.subject || !data.date){
        alert("Please fill all fields");
        return;
    }

    await fetch("/api/attendance",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(data)
    });

    form.reset();
    loadAttendance();
});


async function loadAttendance(){
    const res = await fetch("/api/attendance");
    const data = await res.json();

    list.innerHTML="";

    if(data.length === 0){
        list.innerHTML="<li>No attendance records yet</li>";
        return;
    }

    data.forEach(d=>{
        list.innerHTML += `
            <li>
                <span>${d.name}</span>
                <span>${d.subject}</span>
                <span>${d.status}</span>
                <span>${d.date}</span>
            </li>
        `;
    });
}

loadAttendance();