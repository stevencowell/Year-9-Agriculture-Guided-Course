(function () {
  "use strict";

  const navigation = document.querySelector(".nav-links");
  if (!navigation) return;

  if (!navigation.querySelector("[data-main-menu-link]")) {
    const mainMenu = document.createElement("a");
    mainMenu.href = "https://stevencowell.github.io/Main-Page/";
    mainMenu.textContent = "Main Menu";
    mainMenu.dataset.mainMenuLink = "";
    navigation.prepend(mainMenu);
  }

  if (!navigation.querySelector("[data-teacher-resources-link]")) {
    const teacherResources = document.createElement("a");
    teacherResources.href = "https://stevencowell.github.io/Year-9-Agriculture-Guided-Course/teacher-resources.html";
    teacherResources.textContent = "Teacher Resources";
    teacherResources.dataset.teacherResourcesLink = "";
    navigation.append(teacherResources);
  }
})();
