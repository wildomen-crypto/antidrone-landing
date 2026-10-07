<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    return;
}
// Only this include and its dedicated static resources belong to the article.
// The existing component supplies signed parameters and loads its normal API.
?>
<section id="te-antidrone-article" aria-label="Проектирование антидроновой защиты">
    <link rel="stylesheet" href="/local/antidrone-design/host.css?v=20261007-1">
    <div class="antidrone-variant-shell" data-design-variant="workspace" data-design-theme="industrial">
        <div class="antidrone-variant-center">
            <iframe title="Проектирование антидроновой защиты — 3D-конструктор и заявка"
                    src="/local/antidrone-design/app/bitrix/" height="1500"
                    data-antidrone-frame></iframe>
            <noscript>Для конструктора включите JavaScript. Для обсуждения проекта: +7 (495) 215-07-79, info@topengineer.ru.</noscript>
        </div>
    </div>
    <div hidden data-antidrone-bitrix-contract>
        <?php $GLOBALS['APPLICATION']->IncludeComponent('topengineer:request.form', 'inline', ['MODE' => 'estimate']); ?>
    </div>
    <script src="/local/antidrone-design/bridge.js?v=20261007-1" charset="utf-8"></script>
    <script src="/local/antidrone-design/theme/variants.js?v=scene-gradient-20261006" charset="utf-8"></script>
</section>
