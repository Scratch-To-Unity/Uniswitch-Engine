

function handleKeyPress(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        var convertButton = document.getElementById('convertButton');
        if (!convertButton.disabled) {
            start();
        }
    }
}
function start(){
    document.getElementById("checkmark").setAttribute('hidden', "")
    document.getElementById("cancel-button").removeAttribute('hidden')
    document.getElementById('load').removeAttribute('hidden');
    let playerUsername = document.getElementById('playerUsername').value;
    let projectname = document.getElementById('projectname').value;
    let maxListLength = document.getElementById('maxListLength').value;
    let useCommunityBlocks = document.getElementById('useCommunityBlocks').checked;
    let formatCode = document.getElementById('formatCode').checked;
    let graphicfps = document.getElementById('graphicfps').value;
    let scriptfps = document.getElementById('scriptfps').value;
    let HQPen = document.getElementById('HQPen').checked;
    let options = new ConvertionOptions(playerUsername, graphicfps, maxListLength, useCommunityBlocks, scriptfps, projectname, formatCode, HQPen);
    convert(options);
}
function Cancel(){
    document.getElementById('load').setAttribute('hidden', "");
    StopProgress();
}
function sub(obj){
    if(obj == undefined){return;}
    var file = obj.value;
  var files = file.split("\\");
  var fileName = files[files.length - 1];
  document.getElementById("nameFile").innerHTML = fileName;
}

//s'execute au chargement de la page
document.addEventListener('DOMContentLoaded', function() {

    var myRange = document.getElementById("scriptfps");
    var valueRange = document.getElementById("valueScriptFps");

    sub(document.getElementById("fileInput"));

    myRange.addEventListener("input", function() {
        valueRange.textContent = myRange.value
        valueRange.innerHTML
    });
    
});

//s'execute au chargement de la page
document.addEventListener('DOMContentLoaded', function() {

    var myRange = document.getElementById("graphicfps");
    var valueRange = document.getElementById("valueGraphicFps");

    myRange.addEventListener("input", function() {
        valueRange.textContent = myRange.value
        valueRange.innerHTML
    });
});

function inputNumber(){
    var nombreInput = document.getElementById("maxListLength");
    nombreInput.addEventListener("input", function() {
        // Remplacer le contenu vide par la valeur minimale (1)
        if (this.value === "") {
        this.value = this.min;
        }

        // Convertir la valeur en nombre pour la comparer avec le minimum et le maximum
        var valeur = parseInt(this.value);

        // Assurer que la valeur est entre le minimum et le maximum
        if (valeur < this.min) {
        this.value = this.min;
        } else if (valeur > this.max) {
        this.value = this.max;
        }
     });
}
function windowOpenClose(button){
    var card = button.parentElement.parentElement;
    card.classList.toggle("open");
    if (card.classList.contains("open")) {
        button.textContent = "-";
    } else {
        button.textContent = "+";
    }
}
window.addEventListener('conversion_completed', event => {
    document.getElementById("cancel-button").setAttribute('hidden', "")
    document.getElementById("checkmark").removeAttribute('hidden', "")
});