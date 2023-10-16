let dom;
let json;

const htmlFileSelector = document.getElementById('html-file-selector');
const csvFileSelector = document.getElementById('csv-file-selector');
const contractSelector = document.getElementById('select-contract');
const htmlPreview = document.getElementById('html-preview');

const colorMap = new Map();
const xpathMap = new Map();

function checkContractString(str) {
  const regex = /^contract_(?:[1-9]|[1-9][0-9]|[1][0-4][0-9]|152)$/;
  return regex.test(str);
}

htmlFileSelector.addEventListener('change', (event) => {
  const file = event.target.files[0];
  readHTML(file);
})

csvFileSelector.addEventListener('change', (event) => {
  const file = event.target.files[0];
  readCSV(file);
})

contractSelector.addEventListener('input', () => {
  const selectedValue = contractSelector.value;
  console.log('User selected:', selectedValue);
  if (checkContractString(selectedValue)) {
    console.log("True");
    loadFile("contract/html/"+selectedValue+".html", "html");
    loadFile("contract/csv/"+selectedValue+".csv", "csv");
  }
});

function readHTML(file) {
  const reader = new FileReader();
  //TODO: Read text encoding from header of file
  reader.readAsText(file, "windows-1252");
  console.log(reader);
  reader.addEventListener(
    "load", () => {
      processHTML(reader.result);
    }
  )
}

function readCSV(file) {
  const reader = new FileReader();
  // TODO: Read text encoding from header of file
  reader.readAsText(file, "windows-1252");

  reader.addEventListener("load", () => {
    processCSV(reader.result);
  });
}

function loadFile(path, fileType) {
  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        if (fileType === "html") {
          processHTML(xhr.responseText);
        }
        else if (fileType === "csv") {
          processCSV(xhr.responseText);
        }
      } else {
        console.error('Error loading file:', xhr.status);
      }
    }
  };
  xhr.open('GET', path, true);
  xhr.send();
  return "";
}

function processHTML(text) {
  const parser = new DOMParser();
  dom = parser.parseFromString(text, 'text/html');
  htmlPreview.innerHTML = text;
}

function processCSV(text) {
  const csvRows = text.trim().split('\n').map(row => row.replace(/\r$/, ''))
  const csvData = csvRows.map(row => row.split(','));
  // Assuming the CSV has comma-separated values

  // Now you can process the CSV data (e.g., display, parse, etc.)
  parseXPaths(csvData.slice(1))
  colorize();
}

// Original Code
// function parseXPaths(csvRows) {
//   // Each CSV row is an array of values representing a row
//   for (const csvRow of csvRows) {
//     const xpath = csvRow[0]; // Assuming the XPath is in the first column
//     const text = csvRow[1];
//     const tagged_sequence = csvRow[4]; // Assuming the preds are in the third column
//     // console.log(csvRow);
//     // console.log(xpath+" "+text+" "+tagged_sequence);
//     populateColorMap(tagged_sequence);

//     let xpathMapValue = xpathMap.get(xpath);
//     if (xpathMapValue !== undefined) {
//       xpathMapValue.nodeArray.push([text, tagged_sequence]);
//     } else {
//       // need to handle duplicate nodes - use an Array and not map
//       // need to process the text sequentially
//       const nodeArray = [[text, tagged_sequence]];
//       // Xpath object - contains the text and array of node -> preds
//       xpathMap.set(xpath, {
//         text: text, // There's no text in CSV, so setting an empty string
//         nodeArray: nodeArray
//       });
//     }
//   }
// }


// Original Code
// function colorize() {
//   console.log("Start to colorize")
//   xpathMap.forEach(
//       (value, key) => {
//           //TODO: account for different paths
//           const sliceIndex = "/html/body/".length;
//           //add p tag to all xpaths because the web app renders the html file in a p tag
//           //don't need this if running directly on the html you want to highlight
//           const removedHtmlAndBodyTags  = key.slice(0, sliceIndex) + "div/div/div/p/" + key.slice(sliceIndex);
//           // 7 corresponds to ORDERED_NODE_SNAPSHOT_TYPE
//           const xpathResult = document.evaluate(removedHtmlAndBodyTags, document, null, 7, null)
//           for (let i = 0; i < xpathResult.snapshotLength; i++) {
//               let nodeSnapshot = xpathResult.snapshotItem(i);
//               let nodeTextNodes = [];
//               nodeSnapshot.childNodes.forEach((childNode) => {
//                   if (childNode.nodeType === Node.TEXT_NODE) {
//                       nodeTextNodes.push(childNode);
//                   }
//               })
//               let nodeArray = value.nodeArray;
//               //This is dependent on the assumption that every text in the document
//               //has a token and prediction assigned to it, otherwise this won't work.
//               for (let currentNode of nodeTextNodes) {
//                   let matchedIndex = 0;
//                   let textNode = currentNode;
//                   let nodeString = "";
//                   while (matchedIndex > -1 && nodeArray.length > 0) {
//                       let [node, pred] = nodeArray.shift();
//                       // ignore unknown characters that could not be parsed
//                       while (node.indexOf('�') != -1 && nodeArray.length >= 1) {
//                           [node, pred] = nodeArray.shift();
//                       }
//                       nodeString += node;
//                       const nodeText = textNode.nodeValue;
//                       matchedIndex = nodeText.indexOf(node.trim());
//                       //indexOf returns -1 if not present
//                       if (matchedIndex == -1) {
//                           // log if node text still had text in it that was unmatched
//                           if (nodeText.trim().length != 0) {
//                               console.log('no match: /"' + node + '/" in this text: ' + nodeText + nodeText.trim().length)
//                           }
//                           break;
//                       }
//                       let splitIndex = matchedIndex + node.trim().length;
//                       //create new element to contain colored text
//                       var span = document.createElement("span");
//                       span.appendChild(document.createTextNode(node));
//                       span.style.backgroundColor = colorMap.get(pred);
//                       // split the text node at the index of the matched string
//                       let newNode = textNode.splitText(splitIndex);
//                       // delete the old node that contained the uncolored text
//                       newNode.parentNode.removeChild(newNode.previousSibling);
//                       // insert the new colorized text before the rest of the text node's text value
//                       newNode.parentElement.insertBefore(span, newNode);
//                       textNode = newNode;
//                   }
//               }
//           }
//       }
//   )
// }


// New code: to be tested
function parseXPaths(csvRows) {
  // 1. Extract info from CSV file
  // 2. Initialize xpathMap: {xpath:[text,tagged_sequence]}
  // Each CSV row is an array of values representing a row
  for (const csvRow of csvRows) {
    const xpathOriginal = csvRow[0]; // Assuming the XPath is in the first column
    const sliceIndex = "/html/body/".length;
    xpath = xpathOriginal.slice(0, sliceIndex) + "div/div/div/p/" + xpathOriginal.slice(sliceIndex); // update xpath as original html is rendered inside a p tag
    const text = csvRow[1];
    const tagged_sequence = csvRow[4]; // Assuming the preds are in the third column

    xpathMap.set(xpath, [text, tagged_sequence]);
  }
}

function colorize() {
  console.log("Start to colorize");
  let test = document.getElementById('test');
  // 1. Traverse to the node that needs highlight
  for (let [xpath, [text, tagged_sequence]] of xpathMap){
    // Check if tag is not 'outside'
    if (tagged_sequence.includes('_')) {
      var tag = tagged_sequence.split('_')[1];
    } else {
      var tag = 'o';
    };
    var highlightColor = colorMapper.get(tag);
    // var result = document.evaluate(xpath, document, null, 7, null);
    // for (let i = 0; i < result.snapshotLength; i++) {
    //   let node = result.snapshotItem(i);
    //   node.childNodes.forEach((childNode) => {
    //     childNode.normalize();
    //     if (childNode.nodeType === Node.TEXT_NODE) {
    //       if (childNode.textContent.length > 0) {
    //       var range = document.createRange();
    //       range.selectNodeContents(childNode);
    //       var newParent = document.createElement('span');
    //       newParent.className = highlightColor;
    //       range.surroundContents(newParent);
    //     };
    //     };
    //   });
    // }

    var result = document.evaluate(xpath, document, null, 9, null).singleNodeValue;
    const walker = document.createTreeWalker(result, NodeFilter.SHOW_TEXT, null, false);
    let textNode;

    while (textNode = walker.nextNode()) {
      if (textNode.textContent.length > 0) {
        const span = document.createElement('span');
        span.className = highlightColor;
        const parent = textNode.parentNode;
        parent.insertBefore(span, textNode);
        span.appendChild(textNode);
      }
    }

  }

};
//---------------------------------------------------------------------------------------

// Object Version of colorMapper
const colorMapperObj = {
  t: "DarkOrange",
  tn: "DarkSalmon",
  n: "Gold",
  st: "LightCoral",
  sn: "IndianRed",
  sst: "Plum",
  ssn: "Salmon",
  ssst: "CadetBlue",
  sssn: "LightSteelBlue",
  sssst: "PaleGreen",
  ssssn: "MediumAquaMarine",
  o: "Gainsboro"
};
// Convert object to map for easy iteration
const colorMapper = new Map(Object.entries(colorMapperObj));

// create mapping of pred -> color
function populateColorMap(preds) {
  let predsSplit;
  if (preds != "o"){
      predsSplit = preds.split("_")[1];
  }
  else {
      predsSplit = preds;
  }
  const colorMapValue = colorMapper[predsSplit];
  colorMap.set(preds, colorMapValue);
}

