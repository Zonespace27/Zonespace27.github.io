var SaveTree = {};

const ExplanationDict = {
  dullvessel_position:
    'The current location of the Dull Vessel. Accepts "ocean" and "orbit", leading to Their Waters and The Void, respectively.',
};

function OnLoad() {
  document
    .getElementById("savefile_input")
    .addEventListener("change", function (event) {
      let File = event.target.files[0];
      if (File) {
        let Reader = new FileReader();

        Reader.onload = function (e) {
          ParseText(e.target.result);
        };

        Reader.onerror = function (e) {
          console.error("Error reading file:", e.target.error);
        };

        Reader.readAsText(File);
      } else {
        console.log("No file selected");
      }
    });
}

function Reset() {
  // simple, easy way
  location.reload();
}

/**
 *
 * @param {string} Text
 */
function ParseText(Text) {
  let SplitData = Text.split("::");
  let SaveVersion = SplitData[0];
  let SaveData = SplitData[1];
  let DecodedData;

  if (!SaveVersion || !SaveData) {
    alert(
      "Save file formatted incorrectly, please make sure you are inputting the full, unmodified save file."
    );
    return;
  }

  // add a try catch eventually
  switch (SaveVersion) {
    case "NEURAL BINARY - DO NOT ALTER":
    case "NEURAL BINARY STRING - DO NOT ALTER":
      DecodedData = LZString.decompressFromBase64(SaveData);
      break;

    case "v1":
      DecodedData = decodeURIComponent(atob(SaveData));
      break;

    default:
      DecodedData = atob(SaveData);
      break;
  }
  HandleSave(JSON.parse(DecodedData));
}

/**
 *
 * @param {Object.<string, Object>} Data
 */
function HandleSave(Data) {
  console.log(Data);
  document.getElementById("saveinput").style.display = "none";
  document.getElementById("savedata_topbar").style.display = "inline";
  //document.getElementById("savedata_display").style.display = "inline";
  let Display = document.getElementById("savedata_display");
  for (let DataKey in Data) {
    RecursiveSavePrintout(DataKey, Data[DataKey], Display, 0, SaveTree);
  }
  // Sorting, arrays/dicts get prioritized
  let DisplayChildren = Array.from(Display.children);
  DisplayChildren.sort((a, b) => {
    let A = a.getAttribute("DataType");
    let B = b.getAttribute("DataType");
    return A.localeCompare(B);
  });

  DisplayChildren.forEach((Child) => Display.appendChild(Child));
}

/**
 *
 * @param {*} DataKey
 * @param {*} DataValue
 * @param {HTMLElement | null} Display
 */
function RecursiveSavePrintout(
  DataKey,
  DataValue,
  Display,
  RecursionLevel,
  SaveTreePart
) {
  if (Array.isArray(DataValue)) {
    // Array

    SaveTreePart[DataKey] = [];

    let ContainingBox = document.createElement("div");
    ContainingBox.className = "outlinebox";
    ContainingBox.style.paddingLeft = `${10 * RecursionLevel}px`;
    ContainingBox.setAttribute("DataType", "b"); // sorting purposes

    let ContainedDetails = document.createElement("details");
    let ContainedSummary = document.createElement("summary");
    ContainedSummary.textContent = DataKey;
    ContainedDetails.appendChild(ContainedSummary);
    ContainingBox.appendChild(ContainedDetails);
    Display.appendChild(ContainingBox);

    for (let RecursedDataKey in DataValue) {
      RecursiveSavePrintout(
        RecursedDataKey,
        DataValue[RecursedDataKey],
        ContainedDetails,
        RecursionLevel + 1,
        SaveTreePart[DataKey]
      );
    }
  } else if (DataValue.constructor == Object) {
    // Dict

    SaveTreePart[DataKey] = {};

    let ContainingBox = document.createElement("div");
    ContainingBox.className = "outlinebox";
    ContainingBox.style.paddingLeft = `${10 * RecursionLevel}px`;
    ContainingBox.setAttribute("DataType", "a"); // sorting purposes

    let ContainedDetails = document.createElement("details");
    let ContainedSummary = document.createElement("summary");
    ContainedSummary.textContent = DataKey;
    ContainedDetails.appendChild(ContainedSummary);
    ContainingBox.appendChild(ContainedDetails);
    Display.appendChild(ContainingBox);

    for (let RecursedDataKey in DataValue) {
      RecursiveSavePrintout(
        RecursedDataKey,
        DataValue[RecursedDataKey],
        ContainedDetails,
        RecursionLevel + 1,
        SaveTreePart[DataKey]
      );
    }
  } else {
    // Anything else

    if (Array.isArray(SaveTreePart)) {
      SaveTreePart.push(DataValue);
    } else {
      SaveTreePart[DataKey] = DataValue;
    }

    let ContainingDiv = document.createElement("div");
    ContainingDiv.style.paddingLeft = `${10 * RecursionLevel}px`;
    ContainingDiv.setAttribute("DataType", "c"); // sorting purposes

    let NewLabel = document.createElement("label");
    NewLabel.for = `${DataKey}-${RecursionLevel}`;
    NewLabel.textContent = DataKey;
    NewLabel.style.paddingRight = "8px";
    if (DataKey in ExplanationDict) {
      NewLabel.style.textDecoration = "underline";
      NewLabel.style.textDecorationStyle = "dotted";
      NewLabel.title = ExplanationDict[DataKey];
    }

    let NewInput = document.createElement("input");
    NewInput.name = `${DataKey}-${RecursionLevel}`;
    NewInput.id = `${DataKey}-${RecursionLevel}`;
    NewInput.oldValue = DataValue;
    NewInput.onfocus = function (event) {
      NewInput.oldValue = NewInput.value;
    };
    NewInput.onchange = function (event) {
      if (Array.isArray(SaveTreePart)) {
        let FoundIndex = SaveTreePart.indexOf(NewInput.oldValue);
        if (FoundIndex > -1) {
          SaveTreePart.splice(FoundIndex, 1);
        }
        SaveTreePart.push(event.target.value);
      } else {
        SaveTreePart[DataKey] = event.target.value;
      }
    };

    switch (typeof DataValue) {
      case "string":
        NewInput.type = "text";
        NewInput.value = DataValue;
        break;
      case "boolean":
        NewInput.type = "checkbox";
        NewInput.checked = DataValue;
        break;
      case "number":
      case "bigint":
        NewInput.type = "number";
        NewInput.value = DataValue;
        break;
      // Others we don't really care about since they won't come up
    }

    ContainingDiv.appendChild(NewLabel);
    ContainingDiv.appendChild(NewInput);
    Display.appendChild(ContainingDiv);
  }
}

function ExportData() {
  let B64Data = LZString.compressToBase64(JSON.stringify(SaveTree));
  let ObjectURL = URL.createObjectURL(
    new Blob([`NEURAL BINARY - DO NOT ALTER::${B64Data}::END NEURAL BINARY`], {
      type: "text/plain",
    })
  );
  let DownloadDummyObject = document.createElement("a");
  DownloadDummyObject.href = ObjectURL;
  DownloadDummyObject.download = "save.corru";
  DownloadDummyObject.target = "_blank";
  DownloadDummyObject.style.display = "none";
  document.body.appendChild(DownloadDummyObject);
  DownloadDummyObject.click();
  document.body.removeChild(DownloadDummyObject);
}
