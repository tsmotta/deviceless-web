<?php

function formatName($name)
{
    $name = str_replace("'", '', $name);
    return $name;
}

// arrays de dados
$pessoas = array();
$relacoes = array();

// variaveis utilizadas
$cont = 0;

// le o arquivo'
// abre arquivo
$fp = fopen("./data/DadosOrientacao.csv", "r");
// pula a primeira linha
fgets($fp);
// le os dados
$line = fgets($fp);
while (!feof($fp)) 
{
    // separa os dados
    $data = explode(";", utf8_encode($line));
    // le a proxima linha
    $line = fgets($fp);
    
    // testa o programa
    if ($data[CodPrograma] != 706)
        continue;
//    if ($data[CodOrientador] != 111407)
//        continue;

    if (++$cont > 100)
    {
        //print_r($data);
        break;
    }
    
    if (!isset($pessoas[ $data[CodOrientador] ]['activities']))
        $pessoas[ $data[CodOrientador] ]['activities'] = array();
    if (!isset($pessoas[ $data[CodAluno] ]['activities']))
        $pessoas[ $data[CodAluno] ]['activities'] = array();
    
    // dados do orientador
    $pessoas[ $data[CodOrientador] ]['name'] = formatName($data[NomeOrientador]);
    if ($data[LotacaoOrientador] != 'NULL')
        $pessoas[ $data[CodOrientador] ]['activities'][ $data[EntradaOrientador] ] = 
            $data[LotacaoOrientador] . ' - ' . $data[VinculoOrientador] . '<br/>' .
            'Ingresso: ' . $data[EntradaOrientador] . (trim($data[SaidaOrientador]) != 'NULL' ?  '<br/>Saída: ' . $data[SaidaOrientador] : '');
    $pessoas[ $data[CodOrientador] ]['type'] = 'UFRGS';
    $pessoas[ $data[CodOrientador] ]['sex'] = $data[SexoOrientador];
    
    // dados do aluno
    $pessoas[ $data[CodAluno] ]['name'] = formatName($data[NomeAluno]);
    $pessoas[ $data[CodAluno] ]['activities'][ $data[DataIngresso] ] = 
        $data[NomePrograma] . '<br/>' . 
        $data[NomeCurso] . ' - ' . $data[NomeNivelCurso] . '<br/>' .
        'Ingresso: ' . $data[DataIngresso] . (trim($data[DataSaida]) != 'NULL' ?  '<br/>Saída: ' . $data[DataSaida] : '');
    if (!isset($pessoas[ $data[CodAluno] ]['type']) || ($pessoas[ $data[CodAluno] ]['type'] != 'UFRGS'))
        $pessoas[ $data[CodAluno] ]['type'] = 'unknown';
    $pessoas[ $data[CodAluno] ]['sex'] = $data[SexoAluno];
    if (!isset($pessoas[ $data[CodAluno] ]['courseLevel']) || ($pessoas[ $data[CodAluno] ]['courseLevel'] > 1))
        $pessoas[ $data[CodAluno] ]['courseLevel'] = $data[NivelCurso];
    
    // dados de relacao
    if (!isset($relacoes[ $data[CodOrientador] . '_' . $data[CodAluno] ]))
    {
        $relacoes[ $data[CodOrientador] . '_' . $data[CodAluno] ]['info'] = array();
        $relacoes[ $data[CodOrientador] . '_' . $data[CodAluno] ]['active'] = 0;
        $relacoes[ $data[CodOrientador] . '_' . $data[CodAluno] ]['type'] = 2;
    }
    $relacoes[ $data[CodOrientador] . '_' . $data[CodAluno] ][] = 
        ($data[TipoOrientacao] == 1 ? 'Orienta&ccedil;&atilde;o' : 'Coorienta&ccedil;&atilde;o') . '<br/>' . 
        $data[DataInicioOrientacao] . ' - ' . $data[DataFimOrientacao] . '<br/>' .
        $data[NomeCurso] . ' - ' . $data[NomeNivelCurso];
    if ($data[DataFimOrientacao] == 'NULL')
        $relacoes[ $data[CodOrientador] . '_' . $data[CodAluno] ]['active'] = 1;
    if ($data[TipoOrientacao] == 1)
        $relacoes[ $data[CodOrientador] . '_' . $data[CodAluno] ]['type'] = 1;
} 