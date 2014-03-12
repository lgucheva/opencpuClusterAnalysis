var template_path = Qva.Remote + "?public=only&name=Extensions/opencpuClusterAnalysis/";
function extension_Init()
{
	// Use QlikView's method of loading other files needed by an extension. These files should be added to your extension .zip file (.qar)
	if (typeof jQuery == 'undefined') {
	    Qva.LoadScript(template_path + 'jquery.js', extension_Done);
	}
	else {
	     Qva.LoadScript(template_path + 'json2.js', function(){
	     	Qva.LoadScript("http://www.google.com/jsapi?callback=loadGoogleCoreChart", function(){});
	     });
	    //extension_Done();
	}        
    
    //If more than one script is needed you can nest the calls to get them loaded in the correct order
    //Qva.LoadScript(template_path + "file1.js", function() {
    //Qva.LoadScript(template_path + "file2.js", extension_Done);
    //});

}

function loadGoogleCoreChart() {
	google.load('visualization', '1', {
		packages: ['table'],
		callback: extension_Done
	});
}

/*	//UNCOMMENT THIS BLOCK OF CODE TO ENABLE SELECT BOXES IN PROPERTIES
	if (Qva.Mgr.mySelect == undefined) {
    Qva.Mgr.mySelect = function (owner, elem, name, prefix) {
        if (!Qva.MgrSplit(this, name, prefix)) return;
        owner.AddManager(this);
        this.Element = elem;
        this.ByValue = true;
 
        elem.binderid = owner.binderid;
        elem.Name = this.Name;
 
        elem.onchange = Qva.Mgr.mySelect.OnChange;
        elem.onclick = Qva.CancelBubble;
    }
    Qva.Mgr.mySelect.OnChange = function () {
        var binder = Qva.GetBinder(this.binderid);
        if (!binder.Enabled) return;
        if (this.selectedIndex < 0) return;
        var opt = this.options[this.selectedIndex];
        binder.Set(this.Name, 'text', opt.value, true);
    }
    Qva.Mgr.mySelect.prototype.Paint = function (mode, node) {
        this.Touched = true;
        var element = this.Element;
        var currentValue = node.getAttribute("value");
        if (currentValue == null) currentValue = "";
        var optlen = element.options.length;
        element.disabled = mode != 'e';
        //element.value = currentValue;
        for (var ix = 0; ix < optlen; ++ix) {
            if (element.options[ix].value === currentValue) {
                element.selectedIndex = ix;
            }
        }
        element.style.display = Qva.MgrGetDisplayFromMode(this, mode);
 
    }
}*/
function extension_Done(){
	//Add extension
	Qva.AddExtension('opencpuClusterAnalysis', function(){
		//Load a CSS style sheet
		Qva.LoadCSS(template_path + "style.css");
		var _this = this;
		//get first text box
		var hashkey = _this.Layout.Text0.text.toString();
		var clusterGroup = _this.Layout.Text1.text.toString();
		/*
		//get check box value
		var checkbox1 = _this.Layout.Text1.text.toString();
		var select = _this.Layout.Text2.text.toString();
		*/
		//add a unique name to the extension in order to prevent conflicts with other extensions.
		//basically, take the object ID and add it to a DIV
		var divName = _this.Layout.ObjectId.replace("\\", "_");
		if(_this.Element.children.length == 0) {//if this div doesn't already exist, create a unique div with the divName
			var ui = document.createElement("div");
			ui.setAttribute("id", divName);
			_this.Element.appendChild(ui);
		} else {
			//if it does exist, empty the div so we can fill it again
			$("#" + divName).empty();
		}
		//create a variable to put the html into
		var html = "";
		//set a variable to the dataset to make things easier 
		var td = _this.Data;
		//create arrays
		var zipCode = new Array();
		var accountCount = new Array();
		var avgOrderSize = new Array();
		var customerCnt = new Array();
		var rowNum = new Array();
		//loop through the data set and save the values to the input variable
		for(var rowIx = 0; rowIx < td.Rows.length; rowIx++) {
			//set the current row to a variable
			var row = td.Rows[rowIx];
			//get the value of the item in the dataset row
			zipCode[rowIx] = row[0].text;
			accountCount[rowIx] = row[1].text;
			avgOrderSize[rowIx] = row[2].text;
			customerCnt[rowIx] = row[3].text;
			rowNum[rowIx] = rowIx+1;
			//add those values to the html variable
			//html += "value 1: " + zipCode[rowIx] + " expression value: " + row[rowIx] +"<br />";
		}
		//convert to JSON
		zipCodeJSON = JSON.stringify(zipCode);
		accountCountJSON = JSON.stringify(accountCount);
		avgOrderSizeJSON = JSON.stringify(avgOrderSize);
		customerCntJSON = JSON.stringify(customerCnt);
		rowJSON = JSON.stringify(rowNum);
		//insert the html from the html variable into the extension.
		$("#" + divName).html(html);
		$(_this.Element).css("overflow", "auto");
			//Next make an ajax call to opencpu
	 		var url = "http://beta.opencpu.org/R/tmp/"+hashkey+"/json";
            $.post(
            	url, 
                	{X: zipCodeJSON,
					AccountCount: accountCountJSON,
					AvgOrderSize: avgOrderSizeJSON,
					CustomerCnt: customerCntJSON,
					Row: rowJSON,
					clusterGroup: clusterGroup //Need to make it dynamic eventually
                },
                	function(data) {
                    	var obj = $.parseJSON(data);
                    	//create a Googe data table
						var data = new google.visualization.DataTable();
                    	//Define dimension and expression columns in the google data table
						data.addColumn('string', 'ZipCode');
						data.addColumn('string', 'AccountCount');
						data.addColumn('string', 'AvgOrderSize');
						data.addColumn('string', 'CustomerCnt');
						data.addColumn('number', 'ClusterGroup');
                    	//html += "ZipCode " + "AccountCount " + "AvgOrderSize " + "CustomerCnt " + "ClusterGroup" + "<br />";
                    	for(var i = 0; i < obj.X.length; i++) {
                    		data.addRow([obj.X[i],obj.AccountCount[i],obj.AvgOrderSize[i],obj.CustomerCnt[i],obj["fit.cluster"][i]]);
                    		//html += obj.X[i] + " " + obj.AccountCount[i] + " " + obj.AvgOrderSize[i] + " " + obj.CustomerCnt[i]  + " " + obj["fit.cluster"][i] + "<br />";
                    	}

                    	var graph = new google.visualization.Table(_this.Element);	
                    	//google.visualization.events.addListener(graph, 'select', selectHandler);
                    	graph.draw(data);
                    	
						/*function selectHandler() {
							var selection = graph.getSelection();
							for(var k = 0; k < selection.length; k++) {
								var item = selection[k];
							}

							var sel = data.getValue(item.row,0);
							_this.Data.SelectTextsInColumn(0,false, sel);
			
						} */

                  		//$("#" + divName).html(html);
                  	}
                ); 
	});
}
//Initiate extension
extension_Init();