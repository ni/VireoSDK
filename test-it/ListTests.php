<?php
// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

$files = array();
foreach ( glob("*.via") as $filename) {
    $files[] = $filename;
}
header('Content-type: application/json');
echo json_encode($files);
?>