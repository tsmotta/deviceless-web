<?php 

require_once '../lib/config.php';
require_once 'readFile.php';

$myself = 132034;

?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
   "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>UFRGS Graph</title>
	<link rel="stylesheet" href="./style/style.css" type="text/css">
        <script type="text/javascript" src="./script/jquery-1.8.3.min.js"></script>
    <!-- run from the minified library file: -->
    <script type="text/javascript" src="./lib/arbor.js"></script>  
    <script type="text/javascript" src="./script/main.js"></script>
    <script type="text/javascript">
        $(document).ready(function()
        {
            hideTooltip();
            
            // For dashed lines
            CanvasRenderingContext2D.prototype.dashedLine=function(d,e,g,h,a){if(a==undefined)a=2;this.beginPath();this.moveTo(d,e);var b=g-d,c=h-e;a=Math.floor(Math.sqrt(b*b+c*c)/a);b=b/a;c=c/a;for(var f=0;f++<a;){d+=b;e+=c;this[f%2==0?"moveTo":"lineTo"](d,e)}this[f%2==0?"moveTo":"lineTo"](g,h);this.stroke();this.closePath()};
            
            // browser suporta websockets?
            if (!window.WebSocket) {
                status.innerHTML = "Your browser does not support web sockets!";
                return;
            }
            
            // create the system with sensible repulsion/stiffness/friction/gravity/fps/timestep/precision
            var sys = arbor.ParticleSystem(1000, 600, 0.5, true, 30, 0.02, 0.2); 
            
            sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...

            $("#stopStart").click(function(){
                sys.stop();
            });


            <?php 
                // adiciona os nodos 
                foreach($pessoas as $code => $data)
                {
                    $name = $data['name'];
                    $type = $data['type'];
                    $sex = $data['sex'];
                    $activities = implode('<br/>', $data['activities']);
                    $courseLevel = intval(@$data['courseLevel']);
                    ?>
                    sys.addNode(
                          '<?php print $code?>'
                        , {
                              realName: '<?php print $name?>' 
                            , activities: '<?php print $activities?>'
                            , type: '<?php print $type?>'
                            , sex: '<?php print $sex?>'
                            , courseLevel: <?php print $courseLevel?>
                            , mass: 1.0
                            <?php print ($myself == $code ? ', myself: true' : '')?>
                        }
                    );
                    <?php 
                }
                // adiciona as arestas
                foreach($relacoes as $code => $data)
                {
                    $aux = explode('_', $code);
                    $from = $aux[0];
                    $to = $aux[1];
                    $info = implode('<br/>', $data['info']);
                    $active = $data['active'];
                    $type = $data['type'];
                    ?>
                    sys.addEdge(
                          '<?php print $from?>'
                        , '<?php print $to?>'
                        , {
                              details: '<?php print $info?>'
                            , active: <?php print $active?>
                            , type: <?php print $type?>
                        }
                    );        
                    <?php 
                }
            ?>
        });
    </script>
</head>
<body>
  <canvas id="viewport" width="1024" height="768"></canvas>

  <img id="btnBack" src="./start/img/btn_Back.png" onclick="window.location='./start/'"/>
  
  <div class="tooltip" id="mainTooltip" onmouseover="hideTooltip()"></div>
  
  <div id="sideBar" style="left: 1044px;">
      <strong>Número de nodos:</strong> <?php print count($pessoas)?> <br/>
      <strong>Número de arestas:</strong> <?php print count($relacoes)?> <br/>
      <div id="nodeInfo">
          dados extras
      </div>
      <br/>
      <button id="stopStart">Parar</button>
      <fieldset id="debugInfo">
          <legend>Debug info</legend>
          Graph Energy: <br/>
          &nbsp; max: <span id="eMax"></span> <br/>
          &nbsp; mean: <span id="eMean"></span> <br/>
          Mode: <span id="modeName"></span><br/>
          ZoomScale: <span id="zoomScale"></span> <br/>
          <br/>
          Kinect Server: <span id="serverStatus">None</span> <br/>
		  L Hand: <span id="leftClick"></span> <br/>
		  R Hand: <span id="rightClick"></span> <br/>
          <div id="dataReceived"></div>
      </fieldset>
  </div>
  
  <div id="div_loading">
      <img src="./style/img/gears.gif" alt="Carregando..."/> <br/>
      Carregando o grafo... <br/>
      (isso pode demorar alguns minutos)
  </div>

  <img class="kinectCursor" id="kinectLeft" src="../images/kinectLeftNormal.png"/>
  <img class="kinectCursor" id="kinectRight" src="../images/kinectRightNormal.png"/><br/>
  
</body>
</html>
