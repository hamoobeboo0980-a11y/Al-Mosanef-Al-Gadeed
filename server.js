'use strict';

// ╔══════════════════════════════════════════════════════════════════╗
// ║     Memory Chip Identifier — Simple PWA Server v1.0             ║
// ║     Gemini-First: بسيط وخفيف — Gemini يعمل كل حاجة             ║
// ╚══════════════════════════════════════════════════════════════════╝

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app  = express();
const PORT = process.env.PORT || 8080;

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_KEY || 'AIzaSyAbHZibxNq1bPUVHxW8aa8GvPAsMgCyzgQ'
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Training Images (saved once, used every session) ───
const TRAINING_FILE = path.join(__dirname, 'training.json');
let trainingImages = [];
try {
  if (fs.existsSync(TRAINING_FILE))
    trainingImages = JSON.parse(fs.readFileSync(TRAINING_FILE, 'utf8'));
} catch (_) { trainingImages = []; }

// Per-session: send training images on first analyze call only
const sessionTrained = new Set();

// ─── Databases (for quick local verification) ───
const NORMAL_DB = {"8+1D2":["TP64A8","TP65A8","US-B410","7U-B309","18C-8G","28B-8G","28C-8G","JY938","JWB11","221640","231624","KMK7X000VM-B314","08EMCP08-EL2BV100","08EMCP08-EL2CV100"],"8+1":["KMF720012M-B214","KMQ72000SM-B316","KMFNX0012M-B214","KMFN10012M-B214","KMQN1000SM-B316","NW006A-B316","N10012A-B214","N60012B-B214","KMFN60012M-B214","KMQ7X000SA-B419","KMQNW000SM-B419","KMQN6000SM-B419","H9TQ64A8GTACUR-KUM","H9TQ64A8GTCCUR-KUM","H9TQ64A8GTMCUR-KUM","H9TQ64A8GTDCUR-KUM","H9TQ65A8GTACUR-KUM","TYD0GH121661RA","TYD0GH121644RA","TYD0GH121651RA","TYD0GH221664RA","221644","221651","08EMCP08-NL3DT227","08EMCP08-EL3DT527","08EMCP08-EL3DT227","08EMCP08-EL3BS100","08EMCP08-EL3BT100","08EMCP08-EL3BT227","08EMCP08-EL3BV100","08EMCP08-EL2DM327","08EMCP08-EL3CV100","08EMCP08-EL3AV100","SD9DS28K-8G","28J-8G","JWA60","JY941","JZ099","JY974"],"8+1.5":["KMQN10006B","KMQN10006M","H9TQ64AAETAC-KUM","H9TQ64AAETMC-KUM"],"8+2":["KMQN10013M","KMR7X0001M","KMRNW0001M","H9TQ64ABJTMCUR"],"16+1\u6b63\u7801":["KMF310012M","KMF820012M","KMQ82000SM","KMQ8X000SA","KMFE10012M","KMFE60012M"],"16+1\u6742\u7801":["E60012A-B214","KMQ31000SM","H9TQ17A8GTMCUR","TYD0HH231632RC","TYD0HH121662RA","16EMCP08-EL3BT527","16EMCP08-NL3DT527","16EMCP08-EL3CV100","16EMCP08-NL3DTB28","SDADB48K-16G","JZ089"],"16+1.5":["KMQ310006A","KMQ310006B","KMQ31006M","KMQE6006M","H9TQ17AAETACUR"],"16+2":["KMQ310013B","KMQE60013B","KMQ310013M-B419","KMQ820013M","KMR310001M","KMR820001M","KMR8X0001A","KMR8X0001M","KMQE10013M","KMQE60013M-B419","H9TQ17ABJTACUR","H9TQ17ABJTBCUR","H9TQ17ABJTCCUR","H9TQ17ABJTMCUR","H9TQ18ABJTMCUR","037-125BT","024-125BT","038-107BT","041-107BT","040-107BT","038-125BT"],"16+2\u6742\u7801":["82001M-B612","TYEOHH221657RA","TYE0HH221668RA","TYE0HH231659RA","JY932","JY952","JZ008","JY977","JY950","JZ024","JZ094","16EMCP16-EL3CV100","16EMCP16-ML3BM500","16EMCP16-EL3DT527","16EMCP16-3GM610","16EMCP16-3GTB28","16EMCP16-3ETD28","16ENCP16-3DTB28","16EMCP16-3DTA28","16EMCP16-NL3E527","SDADF4AP-16G","SDADL2AP-16G"],"16+3":["KMR31000BA","KMR31000BM","KMRE1000BM","KMGE6001BM","H9TQ17ADFTACUR","H9TQ17ADFTBCUR","H9TQ17ADFTMCUR","JZ011","JZ006","3100BB-B614"],"32+2":["KMQX60013A","KMQ4Z0013M","KMQX10013M","KMQX60013M","H9TQ26ABJTACUR","H9TQ26ABJTBCUR","H9TQ26ABJTMCUR","KMQD60013M","H9TQ27ABJTMCUR","072-107BT"],"32+2\u6742\u7801":["KMQ210013M","KMR4Z0001A","KMR4Z0001M","KMR4Z00MM","TYE0IH231658RA","JZ025","JZ002","JZ007","JZ012","JZ014"],"32+2D4":["H9HP27ABKMMDAR","H9HP27ABUMMDAR","KM4X6001KM"],"32+3":["KMGX6001BA","KMR21000BM","KMRX1000BM","KMGX6001BM","KMGD6001BM","H9TQ26ADFTACUR","H9TQ26ADFTBCUR","H9TQ27ADFTMCUR","JZ013","JZ050","SDADL28P-32G","JZ004","046-107BT","046-125BT","045-107BT","073-107BT"],"32+3\u6742\u7801":["H9TQ26ADFTMCUR","JZ050"],"32+3D4":["KMDD60018M","H9HP27ADAMADAR","KMDX10018M","KMDX60018M","H9AG8GDMNB*113","JZ018","JZ083","018-125BT","084-075BT"],"32+4":["KMRX10014M","KMRX60014M","KMRD60014M","H9TQ26ACLTMCUR"],"32+4D4":["X10016A-B617","X10016M-B619","TQ27AC","H9HP27ACVUMDARKLM","H9HP26ACVUMDARKLM","KMDX6001DM"],"64+3":["KMRC1000BM","KMGP6001BM","H9TQ52ADFTMCUR","KMGP6001BA","PA094"],"64+3D4":["KM5H80018M","KMDP60018M","JZ090","HP52AD","HQ53AD","JZ185"],"64+4":["KMRC10014M","KMRH60014M","KMRH60014A","KMRP60014M","KMRP60014A","H9TQ52ACLTMCUR","H9TQ53ACLTMCUR","JZ049","JZ128","069-107BT","096-107BT","PA107-107BT","PA070"],"64+4D4":["H9HP52ACPMMDARKMM","H9HP52ACPMADARKMM","KMDH6001DM","KMDH6001DA","KMDP6001DA","KMDP6001DB","KMWC10016M","H9AG9G5ANB","HP53AC","JZ186","JZ481","JZ484","JZ109","JZ053","022-18BT","PG023","022-062BT","022-053BT","090-053BT","PA112","183-053BT"],"64+4UMCP":["HQ52AC","H9HQ53ACPMMDAR","H9HQ54ACPMMDAR","JZ177","KM5H7001DM","KM5P9001DM","KM5P8001DM","KM5C7001DM","KMDC6001DM"],"64+6":["KM3H6001CM","KM3H6001CA","H9HP52AECMMDBRKMM","H9HP52AECMMDARKMM","H9HQ53AECMMDARKEM","H9HQ54AECMMDAR","KMWC10017M","JZ052","086-075BT","PA087"],"64+6UMCP":["UMCP 4DR-64G","KM3P6001CM","KM2H7001CM","KM2P9001CM","JZ168"],"128+4UMCP":["KM5L9001DM","KM5V7001DM","HQ15AC","HQ16AC","JZ150","JZ385"],"128+4":["KMRV50014M","KMWV50017M","KMDV6001DB","KMDV6001DM","KMDV6001DA","JZ103","JZ187","JZ182","HP16AC","093-053BT","092-053BT","PA110","092-153BT","110-053BT"],"128+6":["KM3V6001CM","H9HP16AECMMDARKMM","V6001CA-B708","V6001CB-B708","JZ188","JZ105","JZ114","PA124","PA104","2Q7001CM-BB01"],"128+6UMCP":["KM2V7001CM","KM2V8001CM","H9HQ16AECMMDARKEM","H9HQ15AECMADAR","H9HQ15AECMBDAR","KM5V8001DM","KM2L9001CM","JZ100","JZ151","JZ386"],"128+8":["JZ387","JZ152","JZ266","H9HQ16AFAMMDAR","H9HQ15AFAMBDRA","H9HQ15AFAMADRA","V7001JM-B810","KM8V7001JM-B810","KM8V7001JA-B810","KM8V8001JM-B810","KM8V9001JM-B810","KMWV6001JM-B810","KM8L9001JM-B810"],"128+8D5":["KMAG9001PM"],"256+6":["H9HQ22AECMMDARKEM","KM2B8001CM","H9HQ21AECMZDAR"],"256+8":["H9QT1G6DN6","KM8B8001JM","KMF800JM","H9HQ21AFAMADARKEM","H9HQ21AFAMZDARKEM","H9HQ22AFAMMDARKEM","KM8F9001JM","JZ171","JZ396"],"256+8D5":["KMAS9001PM","JZ361"],"256+12":["KM8F8001MM","H9QT1GGBN6","H9QT1GGDN6"],"256+12D5":["JZ303","KMJS9001RM"]};
const EMMC_DB = {"16":["KLMAG4FE4B-B002","KLMAG4FEAB-B002","KLMAG2GEAC-B001","KLMAG2GEAC-B002","KLMAG2GEAC-B031","KLMAG2WEMB-B031","KLMAG2WEPD-B031","KLMAG4FEAC-B002","KLMAG2GEND-B032","KLMAG2GEND-B031","KLMAG1JENB-B041","KLMAG1JENB-B031","KLMAGIJETD-B041","THGBMAG7A2JBAIR","THGBMSG7A2JBAIR","THGBMSG7A4JBA4W","THGBMAG7A4JBA4R","THGBMBG7C2KBAIL","THGBMBG7D4KBAIW","THGBMFG7C2LBAIL","THGBMHG7C2LBAIL","THGBMFG7CILBAIL","H26M54002EMR","H26M54003EMR","H26M52103FMR","H26M52104FMR","H26M52208FPR","SDIN7DU2-16G","SDIN7DP4-16G","SDINSDE2-16G","SDINSDE4-16G","SDIN9DS2-16G","SDIN9DW4-16G"],"32":["KLMBG8FE4B-B001","KLMBG4GEAC-B001","KLMBG4WEBC-B031","KLMBG2JENB-B041","KLMBG2JETD-B041","KLMBG4GEND-B031","KLUBG4GIBD-E0B2","KLUBG4G1BD-E0B1","KLUBG4GICE-B0B1","KLUBG4WEBD-B031","KLUBG4GIBE-E0B1","THGBMSG8A4JBAIR","THGBMSG8ASJBA4X","THGBM9G8T4KBAR","THGBMAG8A4JBA4R","THGBMBG8D4KBAIR","THGBMFG8C4LBAIR","THGBMHG8C4LBAIR","THGBMF7G8K4LBATR","THGBMHG8C2LBAIL","THGBMFG8C2LBAL","H26M64001EMR","H26M64103EMR","H26M64002EMR","H26M64020SEMR","H28U62301AMR","SDINBDA4-32G","SDIN7DP4-32G","SDIN7DU2-32G","SDINSDE4-32G","SDIN9DW4-32G","SDINADF4-32G","SDINBDG4-32G"],"64":["KLMCGAFE4B-B001","KLMCG8GEAC-B001","KLMCG8GEND-B031","KLMCG8WEBC-B031","KLMCG8WEBD-B031","KLMCG4JENB-B041","KLMCG2KCTA-B041","KLMCG2KETM-B041","KLMCG2UCTA-B041","KLMCG4JENB-B043","KLUCGSG1BD-EOBI","KLUCGSG1BD-E0B2","KLUCG4J1BB-E0B1","KLUCG4J1CB-B0B1","KLUCG1JIED-B0CI","KLUCG2K1EA-B0CI","KLUCG2UCTA-B041","KLUCG4J1EB-B0B1","KLUCG4JIED-B0C1","THGAF4G9N4LBAIR","THGAFSG9T43BAIR","THGBMGG9T4LBAIG","THGBMHG9C4LBAIR","THGBF7G9L4LBATR","THGLF2G9JSLBATC","THGLF2G9JSLBATR","H26M78103CCR","H26M74002EMR","H26M78208CMR","H26M74002HMR","H28U74301AMR","H28M7820SCMR","H28U74303AMR","H28S7Q302BMR","SDIN9DW5-64G","SDIN8DE4-64G","SDINADF4-64G","SDINBDA4-64G","SDINBDD4-64G","SDINDDH4-64G","JZO23","JZ023","JZ160","JZ495"],"128":["KLMDG8JENB-B041","KLMDG4UCTA-B041","KLMDG4UCTB-B041","KLMDG4UERM-B041","KLMDG8JEUD-B04P","KLMDG8JEUD-B04Q","KLMDG8VERF-B041","KLMDGAWEBD-B031","KLUDG8J1CB-C0B1","KLUDG8J1CR-B0B1","KLUDG8VIEE-B0CI","KLUDGAGIBD-E0B1","KLUDG4UIEA-B0CI","KLUDG4U1FB-B0C1","KLUDG4UIYB-BOCP","KLUDG4UIYB-BOCQ","KLUDG4UHDB-B2D1","KLUDG4UHDB-B2E1","KLUDG4UHDC-BOE1","KLUDGSJIZD-BOCP","KLUDGSJIZD-BOCQ","THGAF4TONSLBAIR","THGAFSTOT43BAIR","THGAFBTOT43BABS","THGBF7T0L8LBATA","THGBMFTOCSLBAIG","THGBMHTOCSLBAIG","THGAMRTOT43BAIR","H28U88301AMR","H26T87001CMR","H28S8D301DMR","HNST0SBZGKX015N","HNSTOSDEHKX073N","HNST061ZGKX012N","HNST062EHKX039N","SDINADF4-128G","SDINBDA4-128G","SDINBDA6-128G","SDINDDH4-128G","SDINEDK4-128G","SDINFDO4-128G","JZ144","JZ156","JZ159","JZ244","JZ341","JZ380","JZ496"],"256":["KLMEGSUCTA-B041","KLUEG8U1YB-BOCP","KLUEG8UIYB-BOCQ","KLUEG8UHDB-C2E1","KLUEG8UHDC-BOEI","KLUEGAJIZD-BOCP","KLUEGAJIZD-BOCQ","KLUEGSUIEA-B0CI","THGAFSTITS3BAIR","THGAFBTITS3BABS","THGJFATITS4BAIR","THGJFCTIT84BAIC","H28S9Q301CMR","H28S9X401CMR","HNSTISBZGKX016N","HNSTISDEHKX075N","HNST161ZGKX013N","HN8T162EHKX04IN","SDINBDA4-256G","SDINBDA6-256G","SDINDDH4-256G","SDINEDK4-256G","SDINFDO4-256G","SDINFEO2-256G","JZ147","JZ242","JZ345","JZ369"],"512":["KLUFGSRIEM-B0C1","KLUFGSRHDA-B2E1","KLUFGSRHDB-BOE1","KLUFGSRIEM-BOC1","THGJFAT2T84BAIR","THGJFCT2T84BAIC","HNST2SDEHKX077N","SDINEDK4-512G","SDINFDO4-512G"]};
const MICRON_DB = {"8":["JWA60","JW687"],"16":["JW788"],"32":["JZ132"],"64":["JZ023","JZ160","JZ495","JZ075","JZ178","JZ196","JZ528"],"128":["JZ057","JZ144","JZ156","JZ064","JZ380","JZ341","JZ417","JZ447","JZ413"],"256":["JZ067","JZ161","JZ369","JZ418","JZ449","JZ348","JZ242","JZ459"],"512":["JZ347"]};
const SAMSUNG_RAM_MAP = {'S':'1','2':'1','6':'1.5','K':'2','1':'2','3':'2','A':'3','B':'3','8':'3','D':'4','4':'6','C':'6','J':'8','P':'8','L':'10','M':'12'};
const HYNIX_RAM_MAP = {'A4':'0.5','A8':'1','AB':'2','AD':'3','AC':'4','AE':'6'};

// ─── Utility Functions ───
function detectCompany(code) {
  const u = code.toUpperCase();
  if (u.startsWith('KLM') || u.startsWith('KLU') || u.startsWith('KM')) return 'Samsung';
  if (u.startsWith('H9') || u.startsWith('H26') || u.startsWith('H28') || u.startsWith('HN')) return 'SK Hynix';
  if (u.startsWith('THG')) return 'Toshiba';
  if (u.startsWith('SDIN') || u.startsWith('SDAD')) return 'SanDisk';
  if (u.startsWith('JW') || u.startsWith('JZ')) return 'Micron';
  if (u.startsWith('YMEC') || u.startsWith('TY')) return 'YMEC';
  if (u.startsWith('08EMCP') || u.startsWith('16EMCP') || u.startsWith('16ENCP')) return 'UNIC';
  return 'Unknown';
}

function extractRam(code) {
  if (!code) return null;
  const upper = code.toUpperCase();
  if (upper.startsWith('KM') && !upper.startsWith('KLM') && !upper.startsWith('KLU')) {
    const main = upper.split('-')[0];
    if (main.length >= 3) { const ch = main[main.length-2]; if (SAMSUNG_RAM_MAP[ch]) return SAMSUNG_RAM_MAP[ch]; }
  }
  if (upper.startsWith('H9')) {
    const m = upper.match(/H9[A-Z]{2}\d{2}([A-Z]{2})/);
    if (m && HYNIX_RAM_MAP[m[1]]) return HYNIX_RAM_MAP[m[1]];
  }
  return null;
}

function searchInDB(code) {
  if (!code) return null;
  const u = code.toUpperCase().trim();
  for (const [capacity, codes] of Object.entries(NORMAL_DB)) {
    for (const c of codes) {
      if (u === c.toUpperCase() || u.startsWith(c.toUpperCase().split('-')[0])) {
        const parts = capacity.split('+');
        return { code: u, storage: parts[0], type: '\u0639\u0627\u062f\u064a', company: detectCompany(u), ram: parts[1] ? parts[1].replace(/D[0-9]|\u6b63\u7801|\u6742\u7801|UMCP/g,'').trim() : extractRam(u) };
      }
    }
  }
  for (const [size, codes] of Object.entries(EMMC_DB)) {
    for (const c of codes) {
      if (u === c.toUpperCase() || u.startsWith(c.toUpperCase().split('-')[0])) return { code: u, storage: size, type: '\u0632\u062c\u0627\u062c\u064a', company: detectCompany(u) };
    }
  }
  for (const [size, codes] of Object.entries(MICRON_DB)) {
    for (const c of codes) { if (u === c.toUpperCase()) return { code: u, storage: size, type: '\u0632\u062c\u0627\u062c\u064a', company: 'Micron' }; }
  }
  return null;
}

// ─── Arabic Gemini Prompt (النسخة الجديدة) ───
const GEMINI_PROMPT = `أنت خبير في شرائح الذاكرة (Memory IC chips). بتتكلم مصري.
هذه صورة بورد موبايل عليها شرائح.
مهم جداً:
دور على ايسي الذاكرة (Memory IC) بس - الشرائح اللي بتبدأ بـ Samsung KM/KLM/KLU أو SK Hynix H9/H26/H28/HN8 أو Toshiba THG أو SanDisk SDIN أو Kingston أو YMEC أو UNIC أو Micron JW/JZ
تجاهل تماماً أي ايسي رام أو بروسيسور مكتوب عليه MediaTek أو Qualcomm أو Snapdragon أو SDM أو MT
-الكود المنقوش على ايسي الذاكرة نفسه لازم تقراه بعنايه عشان هتطلع منه بيانات الذاكرة والرام
ركز في الكود الي في وسط المربع الاول ولو الصورة من بعيد وفيها شرائح كتير، اختار ايسي الذاكرة الصح واقرا الكود المنقوش الي عليه بعنايه
لو الكود مش واضح  قول بالظبط كل الحروف الي واضحه وعرفت تقراها من اعلى الايسي بدون تخاريف
كل جلسه تتفتح لابد تشوف امثله التفكيك مره واحده ويخزن الي فهمه منها في دماغه عشان هتفكك بيها اي صوره طول الجلسه
لو الكود واضح  فككه ورد بالنتيجه علي طول في الشات والنتيجه
لوفشلت دور عليه في الخبره المتراكمه  بعد كده الجداول
ودي اهم خبره عندك طريقه تفكيك كل الشركات
=== عادي (Normal BGA) ===
Company: Samsung (سامسونج) - Code prefix: KM (first 2 letters = company ID)
Storage location: LINE 3 of chip - the letter BEFORE the number 100/200/600/700/800/900
Storage codes: N=8G | E=16G | X or D=32G | C or H or P=64G | G or V=128G | F or S=256G
RAM codes (same line): S or 2=1GB | 6=1.5GB | K or 1 or 3=2GB | A or B or 8=3GB | D or 4=4GB | C or J=6-8GB | P=8GB | L=10GB | M=12GB
Company: SK Hynix (هاينكس) - Code prefix: H9 (first 2 letters = company ID)
Storage location: LINE 2 - the digits after the first 4 characters
Storage codes: 17/18/19=16G | 26/27=32G | 52/53=64G | 16=128G
RAM codes: A4=0.5GB | A8=1GB | AB=2GB | AD=3GB | AC=4GB | AE=6GB
Company: Kingston (كينجستون) - Origin: TAIWAN
Storage location: LINE 4 left side - storage written explicitly (e.g. 16EMCP08-N = 16G)
Company: SanDisk (سان ديسك) - Code prefix: SDIN - Origin: TAIWAN
Storage location: LINE 2 - storage written explicitly (e.g. SDINBDA4-64G = 64G)
=== زجاجي (eMMC/UFS) ===
Company: Samsung (سامسونج زجاجي) - Code prefix: KLM or KLU (first 3 letters = company ID)
Storage location: LINE 3 - the 5th character pair indicates storage
Storage codes: AG=16G | BG=32G | CG=64G | DG=128G | EG=256G | FG=512G
Company: SK Hynix (هاينكس زجاجي) - Code prefix: H26 or H28 or HN8
Storage location: LINE 1 - digits in the code
Storage codes: 54=16G | 64=32G | 74=64G | 88=128G | 9=256G
Company: Toshiba (توشيبا) - Code prefix: THG - Origin: TAIWAN/JAPAN
Storage location: LINE 3
Storage codes: G7=16G | G8=32G | G9=64G | T0=128G | T1=256G | T2=512G
Company: SanDisk (سان ديسك زجاجي) - Code prefix: SDIN - Origin: CHINA
Storage location: LINE 2 or 3 - storage written explicitly (e.g. SDINBDA4-64G = 64G)
Company: Micron (ميكرون) - Code prefix: JW or JZ
Storage: full code lookup from table - no abbreviations
Company: YMEC (يمك) - Code prefix: YMEC
Storage location: bottom-left of chip - digit after YMEC
Storage codes: YMEC6=32G | YMEC7=64G | YMEC8=128G | YMEC9=256G
Company: UNIC (يونيك) - Code prefix: 08EMCP or 16EMCP
Storage location: last line
Storage codes: 05G=32G | 06G=64G | 07G=128G
Company: Kingston (كينجستون زجاجي) - Origin: CHINA
Storage location: LINE 4 - storage explicit with EMMC (e.g. EMMC32G = 32G)
عينك تكون في الكاميرا ولسانك في الشات
إذا تم العثور على معلومات واضحة في الصورة، يقوم النظام بالرد عبر الدردشة بالنتائج المستخلصة (مثال: "النص المكتوب على IC الذاكرة هو: XYZ123").
إذا لم يتم العثور على معلومات واضحة أو كانت غير مكتملة، يقوم النظام بالإبلاغ عن ذلك (مثال: "لم أتمكن من قراءة النص بوضوح من الصورة.").
إعادة تحليل منطقة محددة (اختياري): يمكن للمستخدم طلب إعادة تحليل منطقة محددة في الصورة للحصول على دقة أعلى، مثل: "أعد قراءة المنطقة المحددة في الصورة"
واوصف دايما انت شايف ايه
لما تصنف كود، قول عرفت منين
لو المستخدم بيعلمك حاجة جديدة، قوله "تم الحفظ ✅"
لو مش عارف كود، قوله بصراحة وساعده
طبّق القواعد المخصصة واختصارات المدرب - دي أعلى أولوية
لو المدرب بيعلمك اختصار، رد بـ [SHORTCUT]{...}[/SHORTCUT]
لو بيعلمك معلومة جديدة:
[TRAIN]{"code":"الكود","storage":"المساحة","type":"النوع"}[/TRAIN]

رد بـ JSON فقط:
{"code":"THE_CODE","storage":"number","type":"عادي or زجاجي","company":"name","ram":"number or null"}
لو مفيش ايسي ذاكرة: {"code":"NOT_FOUND"}`;


// ═══════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════

// ── POST /api/analyze (Main — Gemini does everything) ──
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, sessionId } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image' });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const sid = sessionId || 'default';
    const isFirstCall = !sessionTrained.has(sid);

    // Build parts: training images (first call only) + user image + prompt
    const parts = [];

    if (isFirstCall && trainingImages.length > 0) {
      parts.push({ text: '\u0623\u0645\u062b\u0644\u0629 \u0627\u0644\u062a\u0641\u0643\u064a\u0643 \u2014 \u0627\u062f\u0631\u0633\u0647\u0627 \u0643\u0648\u064a\u0633 \u0639\u0634\u0627\u0646 \u0647\u062a\u0641\u0643\u0643 \u0628\u064a\u0647\u0627 \u0623\u064a \u0635\u0648\u0631\u0629 \u0637\u0648\u0644 \u0627\u0644\u062c\u0644\u0633\u0629:' });
      for (const img of trainingImages) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: img.b64 } });
        if (img.label) parts.push({ text: img.label });
      }
      parts.push({ text: '\u2500\u2500\u2500 \u062f\u0644\u0648\u0642\u062a\u064a \u0641\u0643\u0651\u0643 \u0627\u0644\u0635\u0648\u0631\u0629 \u062f\u064a: \u2500\u2500\u2500' });
      sessionTrained.add(sid);
      console.log('\uD83C\uDF93 \u062a\u062f\u0631\u064a\u0628 \u0623\u0648\u0644 \u062c\u0644\u0633\u0629:', trainingImages.length, '\u0635\u0648\u0631\u0629');
    }

    parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
    parts.push({ text: GEMINI_PROMPT });

    const gResult = await model.generateContent({
      contents: [{ parts }],
      generationConfig: { temperature: 0 }
    });

    let text = gResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    console.log('\uD83E\uDDE0 Gemini:', text);

    let parsed = null;
    try { parsed = JSON.parse(text); }
    catch (_) { const m = text.match(/\{[\s\S]*?"code"[\s\S]*?\}/); parsed = m ? JSON.parse(m[0]) : null; }

    if (!parsed || !parsed.code || parsed.code === 'NOT_FOUND') {
      return res.json({ code: 'NOT_FOUND', storage: '', type: '', company: '', ram: null, confidence: 0 });
    }

    // Verify with DB
    const dbResult = searchInDB(parsed.code);
    if (dbResult) {
      return res.json({
        code: parsed.code, storage: dbResult.storage, type: dbResult.type,
        company: dbResult.company, ram: dbResult.ram || extractRam(parsed.code) || parsed.ram,
        step: 'gemini+db', confidence: 95
      });
    }

    return res.json({
      code: parsed.code, storage: parsed.storage || '', type: parsed.type || '',
      company: parsed.company || detectCompany(parsed.code),
      ram: parsed.ram || extractRam(parsed.code),
      step: 'gemini', confidence: parsed.storage ? 80 : 40
    });

  } catch (error) {
    console.error('Analyze error:', error.message);
    const msg = (error.message || '').toLowerCase();
    let errMsg = '\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u062a\u062d\u0644\u064a\u0644';
    if (msg.includes('resource') || msg.includes('quota') || msg.includes('429')) errMsg = '\u0637\u0644\u0628\u0627\u062a \u0643\u062a\u064a\u0631 \u2014 \u0627\u0633\u062a\u0646\u0649 \u0634\u0648\u064a\u0629';
    else if (msg.includes('safety')) errMsg = 'Gemini \u0631\u0641\u0636 \u0627\u0644\u0635\u0648\u0631\u0629';
    return res.status(500).json({ error: errMsg, confidence: 0 });
  }
});

// ── POST /api/lookup ──
app.post('/api/lookup', (req, res) => {
  const { code } = req.body;
  if (!code || code.length < 3) return res.json({ found: false });
  const result = searchInDB(code);
  if (result) return res.json({ found: true, ...result });
  return res.json({ found: false, code: code.toUpperCase() });
});

// ── POST /api/chat ──
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, history } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    let historyText = '';
    if (history && history.length > 0) {
      historyText = '\n\u062a\u0627\u0631\u064a\u062e:\n';
      history.slice(-10).forEach(h => { historyText += `${h.role === 'user' ? '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645' : '\u0623\u0646\u062a'}: ${h.text}\n`; });
    }
    const chatPrompt = `\u0623\u0646\u062a \u0645\u0633\u0627\u0639\u062f \u0630\u0643\u064a \u0645\u062a\u062e\u0635\u0635 \u0641\u064a \u0634\u0631\u0627\u0626\u062d \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0644\u0644\u0647\u0648\u0627\u062a\u0641. \u0628\u062a\u062a\u0643\u0644\u0645 \u0645\u0635\u0631\u064a.\n\u0627\u0644\u0646\u0648\u0639: \u0639\u0627\u062f\u064a \u0623\u0648 \u0632\u062c\u0627\u062c\u064a\n${context ? `\u0622\u062e\u0631 \u0643\u0648\u062f: ${context.code || '\u2014'} | ${context.storage || '?'}GB ${context.type || '?'}` : ''}${historyText}\n\u0631\u0633\u0627\u0644\u0629: "${message}"\n\u0631\u062f \u0628\u0625\u064a\u062c\u0627\u0632 \u0628\u0627\u0644\u0645\u0635\u0631\u064a.`;
    const gResult = await model.generateContent({ contents: [{ parts: [{ text: chatPrompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 500 } });
    return res.json({ reply: gResult.response.text().trim() });
  } catch (err) { return res.json({ reply: '\u062e\u0637\u0623 \u2014 \u062c\u0631\u0628 \u062a\u0627\u0646\u064a' }); }
});

// ── POST /api/vision-ocr (stub — no Google Vision key, just return empty) ──
app.post('/api/vision-ocr', (_req, res) => {
  // No Vision API — Gemini handles everything
  res.json({ text: '' });
});

// ── POST /api/confirm ──
app.post('/api/confirm', (req, res) => {
  const { code, storage, type, company, ram } = req.body;
  if (code) console.log(`✅ تأكيد: ${code} = ${storage}GB ${type}`);
  res.json({ success: true });
});

// ── POST /api/correct ──
app.post('/api/correct', (req, res) => {
  const { code, correctStorage, correctType, correctRam } = req.body;
  if (code) console.log(`📝 تصحيح: ${code} → ${correctStorage}GB ${correctType}`);
  res.json({ success: true });
});

// ── GET /api/cache-count ──
app.get('/api/cache-count', (_req, res) => {
  res.json({ count: 0 });
});

// ── Training Images ──
app.get('/api/training', (_req, res) => {
  res.json({ count: trainingImages.length, images: trainingImages.map((t,i) => ({ index: i, label: t.label || '', hasImage: !!t.b64 })) });
});
app.post('/api/training/add', (req, res) => {
  const { imageBase64, label } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image' });
  const b64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  trainingImages.push({ b64, label: label || `\u0645\u062b\u0627\u0644 ${trainingImages.length + 1}` });
  fs.writeFileSync(TRAINING_FILE, JSON.stringify(trainingImages), 'utf8');
  sessionTrained.clear();
  console.log('\uD83C\uDF93 \u062a\u062f\u0631\u064a\u0628:', trainingImages.length);
  res.json({ success: true, count: trainingImages.length });
});
app.post('/api/training/clear', (_req, res) => {
  trainingImages = [];
  fs.writeFileSync(TRAINING_FILE, '[]', 'utf8');
  sessionTrained.clear();
  res.json({ success: true });
});

// ── SPA Fallback ──
app.get('*', (_req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
  console.log('Training images: ' + trainingImages.length);
});
       