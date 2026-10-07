<?php
/**
 * One-shot: register Property Listing New as a Bitrix local app + LEFT_MENU.
 * Does not print secrets. Does not touch app 46 / youtupia.
 */
$_SERVER["DOCUMENT_ROOT"] = "/home/bitrix/www";
$_SERVER["HTTP_HOST"] = "crm.a7grouprealestatedxb.com";
define("NO_KEEP_STATISTIC", true);
define("NOT_CHECK_PERMISSIONS", true);
define("BX_NO_ACCELERATOR_RESET", true);

require $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_before.php";

if (!\Bitrix\Main\Loader::includeModule("rest")) {
    fwrite(STDERR, "rest module missing\n");
    exit(1);
}

$handler = "https://listings.srv1802669.hstgr.cloud/";
$install = "https://listings.srv1802669.hstgr.cloud/install";
$title = "Property Listing New";

function listing_app_row($handler)
{
    $found = \Bitrix\Rest\AppTable::getList([
        "filter" => ["%=URL" => "%listings.srv1802669.hstgr.cloud%"],
        "select" => ["ID", "APP_NAME", "URL", "URL_INSTALL", "STATUS", "INSTALLED", "ACTIVE"],
    ])->fetchAll();
    if ($found) {
        return $found[0];
    }
    $byName = \Bitrix\Rest\AppTable::getList([
        "filter" => ["=APP_NAME" => "Property Listing New", "=STATUS" => "L"],
        "select" => ["ID", "APP_NAME", "URL", "URL_INSTALL", "STATUS", "INSTALLED", "ACTIVE"],
    ])->fetch();
    return $byName ?: null;
}

$app = listing_app_row($handler);
if (!$app) {
    $add = \Bitrix\Rest\AppTable::add([
        "APP_NAME" => $title,
        "URL" => $handler,
        "URL_INSTALL" => $install,
        "SCOPE" => "user,user_brief,placement",
        "STATUS" => \Bitrix\Rest\AppTable::STATUS_LOCAL,
        "ACTIVE" => "Y",
        "INSTALLED" => "Y",
        "MOBILE" => "N",
        "USER_INSTALL" => "N",
    ]);
    if (!$add->isSuccess()) {
        fwrite(STDERR, "APP_ADD_FAILED " . implode("; ", $add->getErrorMessages()) . "\n");
        exit(1);
    }
    $app = listing_app_row($handler);
    if (!$app) {
        fwrite(STDERR, "APP_ADD_NO_ROW\n");
        exit(1);
    }
    echo "APP_CREATED ID=" . $app["ID"] . "\n";
} else {
    echo "APP_EXISTS ID=" . $app["ID"] . "\n";
}

$appId = (int) $app["ID"];
if ($app["URL"] !== $handler || $app["INSTALLED"] !== "Y" || $app["ACTIVE"] !== "Y") {
    $upd = \Bitrix\Rest\AppTable::update($appId, [
        "APP_NAME" => $title,
        "URL" => $handler,
        "URL_INSTALL" => $install,
        "ACTIVE" => "Y",
        "INSTALLED" => "Y",
    ]);
    if (!$upd->isSuccess()) {
        fwrite(STDERR, "APP_UPDATE_FAILED " . implode("; ", $upd->getErrorMessages()) . "\n");
        exit(1);
    }
    echo "APP_UPDATED ID=" . $appId . "\n";
}

$lang = \Bitrix\Rest\AppLangTable::getList([
    "filter" => ["=APP_ID" => $appId, "=LANGUAGE_ID" => "en"],
    "select" => ["ID", "MENU_NAME"],
])->fetch();
if (!$lang) {
    $langAdd = \Bitrix\Rest\AppLangTable::add([
        "APP_ID" => $appId,
        "LANGUAGE_ID" => "en",
        "MENU_NAME" => $title,
    ]);
    if (!$langAdd->isSuccess()) {
        fwrite(STDERR, "LANG_FAILED " . implode("; ", $langAdd->getErrorMessages()) . "\n");
        exit(1);
    }
    echo "LANG_CREATED\n";
}

$placement = \Bitrix\Rest\PlacementTable::getList([
    "filter" => [
        "=APP_ID" => $appId,
        "=PLACEMENT" => "LEFT_MENU",
        "=PLACEMENT_HANDLER" => $handler,
    ],
    "select" => ["ID", "TITLE"],
])->fetch();

if (!$placement) {
    $plAdd = \Bitrix\Rest\PlacementTable::add([
        "APP_ID" => $appId,
        "USER_ID" => 0,
        "PLACEMENT" => "LEFT_MENU",
        "PLACEMENT_HANDLER" => $handler,
        "TITLE" => $title,
        "COMMENT" => "Hostinger listing desk",
    ]);
    if (!$plAdd->isSuccess()) {
        fwrite(STDERR, "PLACEMENT_FAILED " . implode("; ", $plAdd->getErrorMessages()) . "\n");
        exit(1);
    }
    $placementId = (int) $plAdd->getId();
    echo "PLACEMENT_CREATED ID=" . $placementId . "\n";
} else {
    $placementId = (int) $placement["ID"];
    echo "PLACEMENT_EXISTS ID=" . $placementId . "\n";
}

$plLang = \Bitrix\Rest\PlacementLangTable::getList([
    "filter" => ["=PLACEMENT_ID" => $placementId, "=LANGUAGE_ID" => "en"],
    "select" => ["ID"],
])->fetch();
if (!$plLang) {
    $plLangAdd = \Bitrix\Rest\PlacementLangTable::add([
        "PLACEMENT_ID" => $placementId,
        "LANGUAGE_ID" => "en",
        "TITLE" => $title,
        "DESCRIPTION" => "Hostinger listing desk",
    ]);
    if (!$plLangAdd->isSuccess()) {
        fwrite(STDERR, "PLANG_FAILED " . implode("; ", $plLangAdd->getErrorMessages()) . "\n");
        exit(1);
    }
    echo "PLANG_CREATED\n";
}

foreach (["ar", "ru"] as $lid) {
    $extra = \Bitrix\Rest\PlacementLangTable::getList([
        "filter" => ["=PLACEMENT_ID" => $placementId, "=LANGUAGE_ID" => $lid],
        "select" => ["ID"],
    ])->fetch();
    if (!$extra) {
        \Bitrix\Rest\PlacementLangTable::add([
            "PLACEMENT_ID" => $placementId,
            "LANGUAGE_ID" => $lid,
            "TITLE" => $title,
            "DESCRIPTION" => "Hostinger listing desk",
        ]);
    }
}

echo "OK TITLE=" . $title . " HANDLER=" . $handler . " APP_ID=" . $appId . " PLACEMENT_ID=" . $placementId . "\n";
