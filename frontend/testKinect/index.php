<?php

require_once '../lib/config.php';

?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
   "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>Kinect Tester</title>
	<link rel="stylesheet" href="./style/style.css" type="text/css">
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js"></script>
    <!-- run from the minified library file: -->
    <script type="text/javascript" src="./script/main.js"></script>
</head>
<body>
    <div class="tooltip" id="mainTooltip" onmouseover="hideTooltip()"></div>

    <img class="kinectCursor" id="kinectLeft" src="../images/kinectLeftNormal.png"/>
    <img class="kinectCursor" id="kinectRight" src="../images/kinectRightNormal.png"/><br/>

    <div id="divLeft" class="column">
        
    </div>
    
    <div id="divRight" class="column">
        
    </div>
    
    <div id="status">
        <span id="serverStatus">Sem conexão</span>
        <span id="modeName">desconectado</span>
    </div>
</body>
</html>
