function handleKeyPress(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        var convertButton = document.getElementById('convertButton');
        if (!convertButton.disabled) {
            let playerUsername = document.getElementById('playerUsername')
            let projectname = document.getElementById('projectname')
            let maxListLenght = document.getElementById('maxListLenght')
            let useCommunityBlocks = document.getElementById('useCommunityBlocks')
            let formatCode = document.getElementById('formatCode')
            let graphicfps = document.getElementById('graphicfps')
            let scriptfps = document.getElementById('scriptfps')
            let options = new ConvertionOptions(playerUsername, graphicfps, maxListLenght, useCommunityBlocks, scriptfps, projectname, formatCode)
            convert(options)
        }
    }
}