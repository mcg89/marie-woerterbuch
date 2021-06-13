if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').then(function (registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function (err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
    setup();
  });
} else {
  window.addEventListener('load', setup);
}

var deutibSorted = [];
var tibdeuSorted = [];

function setup() {
  document.querySelector("#searchbar").addEventListener("keyup", search)
  window.addEventListener('resize', resizeSlider);
  showSlides(slideIndex);
  window.setInterval(function () {
    timer++;
    if (timer >= 100) {
      plusSlides(1);
    }
  }, 100)
  updateDatabase();
}

var slides = document.getElementsByClassName("mySlides");
var slideIndex = 0;
var timer = 0;

function plusSlides(n) {
  timer = 0;
  showSlides(slideIndex += n);
}

function showSlides(n) {
  if (n >= slides.length) { slideIndex = 0 }
  if (n < 0) { slideIndex = slides.length - 1}
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.opacity = (i == slideIndex) ? 1 : 0;
  }
  resizeSlider();
}

function resizeSlider() {
  document.querySelector(".slideshow-container").style = "height: " + slides[slideIndex].offsetHeight + "px;";
}

function updateDatabase() {
  try {
    document.querySelector("#tibdeu-loading").classList.remove("hidden")
    document.querySelector("#deutib-loading").classList.remove("hidden")
  } catch (error) {
    console.log(error)
  }

  let request = new XMLHttpRequest();
  request.open("get", "data/database-latest.csv")
  request.addEventListener('load', function (event) {
    if (request.status >= 200 && request.status < 300) {
      console.log(request.responseText);
      parseResponse(request.responseText);
    } else {
      console.warn(request.statusText, request.responseText);
    }
  });
  request.send(null);
}

function parseResponse(text) {
  let table = text.split("\n");

  deutibSorted = []
  tibdeuSorted = []

  for (let i = 0; i < table.length; i++) {
    let data = table[i].split(";");
    deutibSorted.push({ "german": data[0], "transcript": data[1], "tibet": data[2], "tooltip": data.slice(3) })
    tibdeuSorted.push({ "german": data[0], "transcript": data[1], "tibet": data[2], "tooltip": data.slice(3) })
  }

  let sortFunc = function (property) {
    return function (a, b) {
      if (a[property] > b[property])
        return 1;
      else if (a[property] < b[property])
        return -1;
      return 0;
    }
  }

  deutibSorted.sort(sortFunc("german"));
  tibdeuSorted.sort(sortFunc("transcript"));

  let currentGermanLetter, currentTibetLetter = "";

  let deutibDiv = document.querySelector("#deutib-content");
  let tibdeuDiv = document.querySelector("#tibdeu-content");

  deutibDiv.innerHTML = "";
  tibdeuDiv.innerHTML = "";

  for (let i = 0; i < deutibSorted.length; i++) {
    let gl = deutibSorted[i]["german"][0].toUpperCase()
    let tl = tibdeuSorted[i]["transcript"][0].toUpperCase()
    if (gl != currentGermanLetter) {
      deutibDiv.append(makeSeparator(gl));
      currentGermanLetter = gl;
    }
    if (tl != currentTibetLetter) {
      tibdeuDiv.append(makeSeparator(tl));
      currentTibetLetter = tl;
    }
    deutibDiv.append(makeCard(deutibSorted[i], "deutib"));
    tibdeuDiv.append(makeCard(tibdeuSorted[i], "tibdeu"));
  }

  document.querySelector("#tibdeu-loading").classList.add("hidden");
  document.querySelector("#deutib-loading").classList.add("hidden");
}

var context = "home"

function search(event) {
  if (event.code !== "Enter") {
    return;
  }

  //Switch to search pane
  let activeItem = document.querySelector("section.is-active")
  if (activeItem.id != "search") {
    context = activeItem.id
    activeItem.classList.remove("is-active")
    document.querySelector("#search").classList.add("is-active")
  }

  // update search query
  let query = document.querySelector("#searchbar").value
  document.querySelector("#search-query").innerHTML = query
  document.querySelector("#search-loading").classList.remove("hidden")

  // display List
  let usedList = deutibSorted
  if (context == "tibdeu") {
    usedList = tibdeuSorted
  }

  let currentLetter = "";
  let searchDiv = document.querySelector("#search-content");
  let hasResults = false;
  searchDiv.innerHTML = "";

  for (let i = 0; i < usedList.length; i++) {
    if (Object.values(usedList[i]).join().search(query) > -1) {
      let cl = usedList[i]["german"][0].toUpperCase()
      if (context === "tibdeu") {
        cl = usedList[i]["transcript"][0].toUpperCase()
      }

      if (cl != currentLetter) {
        searchDiv.append(makeSeparator(cl));
        currentLetter = cl
      }

      searchDiv.append(makeCard(usedList[i], context));
      hasResults = true;
    }
  }
  if (!hasResults) {
    searchDiv.innerHTML = "<div style='text-align: center;'><h4>Es wurden keine Ergebnisse gefunden.</h4></div>";
  }
  document.querySelector("#search-loading").classList.add("hidden")
}

function makeCard(cardDetails, mode) {
  let cardDiv = document.createElement("div");
  cardDiv.classList = "mdl-card mdl-shadow--2dp mdl-cell word-card mdl-cell--3-col mdl-cell--4-col-tablet mdl-cell--12-col-phone"
  cardDiv.style = "margin: 5px;"

  let word = cardDetails["german"];
  let translation = "<td>Wylie: </td><td><b>" + cardDetails["transcript"] + "</b></td>";

  if (mode === "tibdeu") {
    word = cardDetails["transcript"];
    translation = "<td>Deutsch: </td><td><b>" + cardDetails["german"] + "</b></td>";
  }
  let tibet = "<td>Tibetisch: </td><td>" + cardDetails["tibet"] + "</td>";

  let tooltip = ""
  cardDetails["tooltip"].forEach(element => {
    if (element.trim() !== "") {
      if (tooltip === "") {
        tooltip += "<tr><td colspan='2'>Weitere Infos: <br><ul><li>";
      }
      tooltip += element + "</li><li>"
    }
  });
  if (tooltip !== "") {
    tooltip += "</li></ul></td></tr>";
  }

  cardDiv.innerHTML = '<div class="mdl-card__title"><h2 class="mdl-card__title-text">' + word + '</h2></div>' +
    '<div class="mdl-card__supporting-text"><table><tr>' + translation + '</tr><tr>' + tibet + '</tr>' + tooltip + '</div>'

  return cardDiv
}

function makeSeparator(text) {
  let separator = document.createElement("div")
  separator.classList = "separator mdl-cell mdl-cell--12-col"
  separator.innerHTML = "<h4>" + text + "</h4>"
  return separator
}