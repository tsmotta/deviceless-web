<?php

if (!isset($_POST['fileName'], $_POST['fileText']))
    die("Wrong paraeters");

$fp = fopen("./testFiles/".$_POST['fileName'].".csv", "w");

$lines = explode("\n", $_POST['fileText']);

for ($i = 0; $i < count($lines); $i++)
{
    if ($i == 0)
        fwrite($fp,  "Arquivo;".$lines[$i].PHP_EOL);
    else 
        fwrite($fp, $_POST['fileName'].";".$lines[$i].PHP_EOL);
}

fclose($fp);