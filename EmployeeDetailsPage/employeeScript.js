// About handle
const btns = document.querySelectorAll('.harshit-block-text-button');

btns.forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.about');
    card.classList.toggle('show-more');
    btn.textContent = card.classList.contains('show-more') ? 'Read Less' : 'Read More';
  });
});

// responsibilities list
document.getElementById('toggle-responsibilities').addEventListener("click", function() {
    const hiddenItems = document.querySelectorAll(".simple-list-hidden");
    hiddenItems.forEach(item => item.classList.toggle("show"));

    if(this.textContent === "Read More") {
        this.textContent = "Read Less";
    }else {
        this.textContent = "Read More";
    }
})