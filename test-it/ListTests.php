<?php
$files = array();
foreach ( glob("*.via") as $filename) {
    $files[] = $filename;
}
header('Content-type: application/json');
echo json_encode($files);
?>