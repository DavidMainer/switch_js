//USING JAVASCRIPT TO DISPLAY DAY

const display = document.querySelector(".day");
let day;
let particular = new Date().getDay();

switch (particular) {
  case 0:
    day = "Sunday";
    break;
  case 1:
    day = "Monday";
    break;
  case 2:
    day = "Tuesday";
    break;
  case 3:
    day = "Wednesday";
    break;
  case 4:
    day = "Thursday";
    break;
  case 5:
    day = "Friday";
    break;
  case 6:
    day = "Saturday";
    break;
  default:
    text = "Date not found server error !!";
}

display.innerHTML = "Today is ....  " + day;
