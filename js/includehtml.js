function includeHTML() {
    var z, i, e, f, x;
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
      e = z[i];
      f = e.getAttribute("include-html");
      if (f) {
        x = new XMLHttpRequest();
        x.onreadystatechange = function() {
          if (this.readyState == 4) {
            if (this.status == 200) {e.innerHTML = this.responseText;}
            if (this.status == 404) {e.innerHTML = "Page not found.";}
            e.removeAttribute("include-html");
            includeHTML();
          }
        }
        x.open("GET", f, true);
        x.send();
        return;
      }
    }
  }