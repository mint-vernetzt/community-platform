# State-data-prototype

## How to use this package

1. Edit the `DATABASE_URL` in the .env to point to your database
2. Run `prisma migrate reset`or `prisma migrate dev --create_state_and_district_model_and_relationship`
3. Run `npm start` (run `npm start -- --help` for options)
4. Check you database (and hopefully be happy)

## Sample output

```bash
user@host:~/.../german-states-and-districts-dataset$ npm start -- --verbose
$ ts-node load-german-states-and-districts.ts --verbose
Deleted 0 states and 0 districts
Updated 0 states and 0 districts
Created 16 states and 411 districts

All states with their districts:
[
  {
    agsPrefix: '10',
    name: 'Saarland',
    districts: [
      {
        ags: '10041',
        name: 'LK Stadtverband Saarbrücken',
        stateAgsPrefix: '10'
      },
      { ags: '10042', name: 'LK Merzig-Wadern', stateAgsPrefix: '10' },
      { ags: '10043', name: 'LK Neunkirchen', stateAgsPrefix: '10' },
      { ags: '10044', name: 'LK Saarlouis', stateAgsPrefix: '10' },
      {
        ags: '10045',
        name: 'LK Saarpfalz-Kreis',
        stateAgsPrefix: '10'
      },
      { ags: '10046', name: 'LK Sankt Wendel', stateAgsPrefix: '10' }
    ]
  },
  {
    agsPrefix: '11',
    name: 'Berlin',
    districts: [
      { ags: '11001', name: 'SK Berlin Mitte', stateAgsPrefix: '11' },
      {
        ags: '11002',
        name: 'SK Berlin Friedrichshain-Kreuzberg',
        stateAgsPrefix: '11'
      },
      { ags: '11003', name: 'SK Berlin Pankow', stateAgsPrefix: '11' },
      {
        ags: '11004',
        name: 'SK Berlin Charlottenburg-Wilmersdorf',
        stateAgsPrefix: '11'
      },
      { ags: '11005', name: 'SK Berlin Spandau', stateAgsPrefix: '11' },
      {
        ags: '11006',
        name: 'SK Berlin Steglitz-Zehlendorf',
        stateAgsPrefix: '11'
      },
      {
        ags: '11007',
        name: 'SK Berlin Tempelhof-Schöneberg',
        stateAgsPrefix: '11'
      },
      {
        ags: '11008',
        name: 'SK Berlin Neukölln',
        stateAgsPrefix: '11'
      },
      {
        ags: '11009',
        name: 'SK Berlin Treptow-Köpenick',
        stateAgsPrefix: '11'
      },
      {
        ags: '11010',
        name: 'SK Berlin Marzahn-Hellersdorf',
        stateAgsPrefix: '11'
      },
      {
        ags: '11011',
        name: 'SK Berlin Lichtenberg',
        stateAgsPrefix: '11'
      },
      {
        ags: '11012',
        name: 'SK Berlin Reinickendorf',
        stateAgsPrefix: '11'
      }
    ]
  },
  {
    agsPrefix: '12',
    name: 'Brandenburg',
    districts: [
      {
        ags: '12051',
        name: 'SK Brandenburg a.d.Havel',
        stateAgsPrefix: '12'
      },
      { ags: '12052', name: 'SK Cottbus', stateAgsPrefix: '12' },
      {
        ags: '12053',
        name: 'SK Frankfurt (Oder)',
        stateAgsPrefix: '12'
      },
      { ags: '12054', name: 'SK Potsdam', stateAgsPrefix: '12' },
      { ags: '12060', name: 'LK Barnim', stateAgsPrefix: '12' },
      {
        ags: '12061',
        name: 'LK Dahme-Spreewald',
        stateAgsPrefix: '12'
      },
      { ags: '12062', name: 'LK Elbe-Elster', stateAgsPrefix: '12' },
      { ags: '12063', name: 'LK Havelland', stateAgsPrefix: '12' },
      {
        ags: '12064',
        name: 'LK Märkisch-Oderland',
        stateAgsPrefix: '12'
      },
      { ags: '12065', name: 'LK Oberhavel', stateAgsPrefix: '12' },
      {
        ags: '12066',
        name: 'LK Oberspreewald-Lausitz',
        stateAgsPrefix: '12'
      },
      { ags: '12067', name: 'LK Oder-Spree', stateAgsPrefix: '12' },
      {
        ags: '12068',
        name: 'LK Ostprignitz-Ruppin',
        stateAgsPrefix: '12'
      },
      {
        ags: '12069',
        name: 'LK Potsdam-Mittelmark',
        stateAgsPrefix: '12'
      },
      { ags: '12070', name: 'LK Prignitz', stateAgsPrefix: '12' },
      { ags: '12071', name: 'LK Spree-Neiße', stateAgsPrefix: '12' },
      { ags: '12072', name: 'LK Teltow-Fläming', stateAgsPrefix: '12' },
      { ags: '12073', name: 'LK Uckermark', stateAgsPrefix: '12' }
    ]
  },
  {
    agsPrefix: '13',
    name: 'Mecklenburg-Vorpommern',
    districts: [
      { ags: '13003', name: 'SK Rostock', stateAgsPrefix: '13' },
      { ags: '13004', name: 'SK Schwerin', stateAgsPrefix: '13' },
      {
        ags: '13071',
        name: 'LK Mecklenburgische Seenplatte',
        stateAgsPrefix: '13'
      },
      { ags: '13072', name: 'LK Rostock', stateAgsPrefix: '13' },
      {
        ags: '13073',
        name: 'LK Vorpommern-Rügen',
        stateAgsPrefix: '13'
      },
      {
        ags: '13074',
        name: 'LK Nordwestmecklenburg',
        stateAgsPrefix: '13'
      },
      {
        ags: '13075',
        name: 'LK Vorpommern-Greifswald',
        stateAgsPrefix: '13'
      },
      {
        ags: '13076',
        name: 'LK Ludwigslust-Parchim',
        stateAgsPrefix: '13'
      }
    ]
  },
  {
    agsPrefix: '14',
    name: 'Sachsen',
    districts: [
      { ags: '14511', name: 'SK Chemnitz', stateAgsPrefix: '14' },
      {
        ags: '14521',
        name: 'LK Erzgebirgskreis',
        stateAgsPrefix: '14'
      },
      { ags: '14522', name: 'LK Mittelsachsen', stateAgsPrefix: '14' },
      { ags: '14523', name: 'LK Vogtlandkreis', stateAgsPrefix: '14' },
      { ags: '14524', name: 'LK Zwickau', stateAgsPrefix: '14' },
      { ags: '14612', name: 'SK Dresden', stateAgsPrefix: '14' },
      { ags: '14625', name: 'LK Bautzen', stateAgsPrefix: '14' },
      { ags: '14626', name: 'LK Görlitz', stateAgsPrefix: '14' },
      { ags: '14627', name: 'LK Meißen', stateAgsPrefix: '14' },
      {
        ags: '14628',
        name: 'LK Sächsische Schweiz-Osterzgebirge',
        stateAgsPrefix: '14'
      },
      { ags: '14713', name: 'SK Leipzig', stateAgsPrefix: '14' },
      { ags: '14729', name: 'LK Leipzig', stateAgsPrefix: '14' },
      { ags: '14730', name: 'LK Nordsachsen', stateAgsPrefix: '14' }
    ]
  },
  {
    agsPrefix: '15',
    name: 'Sachsen-Anhalt',
    districts: [
      { ags: '15001', name: 'SK Dessau-Roßlau', stateAgsPrefix: '15' },
      { ags: '15002', name: 'SK Halle', stateAgsPrefix: '15' },
      { ags: '15003', name: 'SK Magdeburg', stateAgsPrefix: '15' },
      {
        ags: '15081',
        name: 'LK Altmarkkreis Salzwedel',
        stateAgsPrefix: '15'
      },
      {
        ags: '15082',
        name: 'LK Anhalt-Bitterfeld',
        stateAgsPrefix: '15'
      },
      { ags: '15083', name: 'LK Börde', stateAgsPrefix: '15' },
      {
        ags: '15084',
        name: 'LK Burgenlandkreis',
        stateAgsPrefix: '15'
      },
      { ags: '15085', name: 'LK Harz', stateAgsPrefix: '15' },
      {
        ags: '15086',
        name: 'LK Jerichower Land',
        stateAgsPrefix: '15'
      },
      {
        ags: '15087',
        name: 'LK Mansfeld-Südharz',
        stateAgsPrefix: '15'
      },
      { ags: '15088', name: 'LK Saalekreis', stateAgsPrefix: '15' },
      { ags: '15089', name: 'LK Salzlandkreis', stateAgsPrefix: '15' },
      { ags: '15090', name: 'LK Stendal', stateAgsPrefix: '15' },
      { ags: '15091', name: 'LK Wittenberg', stateAgsPrefix: '15' }
    ]
  },
  {
    agsPrefix: '16',
    name: 'Thüringen',
    districts: [
      { ags: '16051', name: 'SK Erfurt', stateAgsPrefix: '16' },
      { ags: '16052', name: 'SK Gera', stateAgsPrefix: '16' },
      { ags: '16053', name: 'SK Jena', stateAgsPrefix: '16' },
      { ags: '16054', name: 'SK Suhl', stateAgsPrefix: '16' },
      { ags: '16055', name: 'SK Weimar', stateAgsPrefix: '16' },
      { ags: '16061', name: 'LK Eichsfeld', stateAgsPrefix: '16' },
      { ags: '16062', name: 'LK Nordhausen', stateAgsPrefix: '16' },
      { ags: '16063', name: 'LK Wartburgkreis', stateAgsPrefix: '16' },
      {
        ags: '16064',
        name: 'LK Unstrut-Hainich-Kreis',
        stateAgsPrefix: '16'
      },
      {
        ags: '16065',
        name: 'LK Kyffhäuserkreis',
        stateAgsPrefix: '16'
      },
      {
        ags: '16066',
        name: 'LK Schmalkalden-Meiningen',
        stateAgsPrefix: '16'
      },
      { ags: '16067', name: 'LK Gotha', stateAgsPrefix: '16' },
      { ags: '16068', name: 'LK Sömmerda', stateAgsPrefix: '16' },
      { ags: '16069', name: 'LK Hildburghausen', stateAgsPrefix: '16' },
      { ags: '16070', name: 'LK Ilm-Kreis', stateAgsPrefix: '16' },
      { ags: '16071', name: 'LK Weimarer Land', stateAgsPrefix: '16' },
      { ags: '16072', name: 'LK Sonneberg', stateAgsPrefix: '16' },
      {
        ags: '16073',
        name: 'LK Saalfeld-Rudolstadt',
        stateAgsPrefix: '16'
      },
      {
        ags: '16074',
        name: 'LK Saale-Holzland-Kreis',
        stateAgsPrefix: '16'
      },
      {
        ags: '16075',
        name: 'LK Saale-Orla-Kreis',
        stateAgsPrefix: '16'
      },
      { ags: '16076', name: 'LK Greiz', stateAgsPrefix: '16' },
      {
        ags: '16077',
        name: 'LK Altenburger Land',
        stateAgsPrefix: '16'
      }
    ]
  },
  {
    agsPrefix: '01',
    name: 'Schleswig-Holstein',
    districts: [
      { ags: '01001', name: 'SK Flensburg', stateAgsPrefix: '01' },
      { ags: '01002', name: 'SK Kiel', stateAgsPrefix: '01' },
      { ags: '01003', name: 'SK Lübeck', stateAgsPrefix: '01' },
      { ags: '01004', name: 'SK Neumünster', stateAgsPrefix: '01' },
      { ags: '01051', name: 'LK Dithmarschen', stateAgsPrefix: '01' },
      {
        ags: '01053',
        name: 'LK Herzogtum Lauenburg',
        stateAgsPrefix: '01'
      },
      { ags: '01054', name: 'LK Nordfriesland', stateAgsPrefix: '01' },
      { ags: '01055', name: 'LK Ostholstein', stateAgsPrefix: '01' },
      { ags: '01056', name: 'LK Pinneberg', stateAgsPrefix: '01' },
      { ags: '01057', name: 'LK Plön', stateAgsPrefix: '01' },
      {
        ags: '01058',
        name: 'LK Rendsburg-Eckernförde',
        stateAgsPrefix: '01'
      },
      {
        ags: '01059',
        name: 'LK Schleswig-Flensburg',
        stateAgsPrefix: '01'
      },
      { ags: '01060', name: 'LK Segeberg', stateAgsPrefix: '01' },
      { ags: '01061', name: 'LK Steinburg', stateAgsPrefix: '01' },
      { ags: '01062', name: 'LK Stormarn', stateAgsPrefix: '01' }
    ]
  },
  {
    agsPrefix: '02',
    name: 'Hamburg',
    districts: [ { ags: '02000', name: 'SK Hamburg', stateAgsPrefix: '02' } ]
  },
  {
    agsPrefix: '03',
    name: 'Niedersachsen',
    districts: [
      { ags: '03101', name: 'SK Braunschweig', stateAgsPrefix: '03' },
      { ags: '03102', name: 'SK Salzgitter', stateAgsPrefix: '03' },
      { ags: '03103', name: 'SK Wolfsburg', stateAgsPrefix: '03' },
      { ags: '03151', name: 'LK Gifhorn', stateAgsPrefix: '03' },
      { ags: '03153', name: 'LK Goslar', stateAgsPrefix: '03' },
      { ags: '03154', name: 'LK Helmstedt', stateAgsPrefix: '03' },
      { ags: '03155', name: 'LK Northeim', stateAgsPrefix: '03' },
      { ags: '03157', name: 'LK Peine', stateAgsPrefix: '03' },
      { ags: '03158', name: 'LK Wolfenbüttel', stateAgsPrefix: '03' },
      { ags: '03159', name: 'LK Göttingen', stateAgsPrefix: '03' },
      { ags: '03241', name: 'Region Hannover', stateAgsPrefix: '03' },
      { ags: '03251', name: 'LK Diepholz', stateAgsPrefix: '03' },
      { ags: '03252', name: 'LK Hameln-Pyrmont', stateAgsPrefix: '03' },
      { ags: '03254', name: 'LK Hildesheim', stateAgsPrefix: '03' },
      { ags: '03255', name: 'LK Holzminden', stateAgsPrefix: '03' },
      {
        ags: '03256',
        name: 'LK Nienburg (Weser)',
        stateAgsPrefix: '03'
      },
      { ags: '03257', name: 'LK Schaumburg', stateAgsPrefix: '03' },
      { ags: '03351', name: 'LK Celle', stateAgsPrefix: '03' },
      { ags: '03352', name: 'LK Cuxhaven', stateAgsPrefix: '03' },
      { ags: '03353', name: 'LK Harburg', stateAgsPrefix: '03' },
      {
        ags: '03354',
        name: 'LK Lüchow-Dannenberg',
        stateAgsPrefix: '03'
      },
      { ags: '03355', name: 'LK Lüneburg', stateAgsPrefix: '03' },
      { ags: '03356', name: 'LK Osterholz', stateAgsPrefix: '03' },
      {
        ags: '03357',
        name: 'LK Rotenburg (Wümme)',
        stateAgsPrefix: '03'
      },
      { ags: '03358', name: 'LK Heidekreis', stateAgsPrefix: '03' },
      { ags: '03359', name: 'LK Stade', stateAgsPrefix: '03' },
      { ags: '03360', name: 'LK Uelzen', stateAgsPrefix: '03' },
      { ags: '03361', name: 'LK Verden', stateAgsPrefix: '03' },
      { ags: '03401', name: 'SK Delmenhorst', stateAgsPrefix: '03' },
      { ags: '03402', name: 'SK Emden', stateAgsPrefix: '03' },
      { ags: '03403', name: 'SK Oldenburg', stateAgsPrefix: '03' },
      { ags: '03404', name: 'SK Osnabrück', stateAgsPrefix: '03' },
      { ags: '03405', name: 'SK Wilhelmshaven', stateAgsPrefix: '03' },
      { ags: '03451', name: 'LK Ammerland', stateAgsPrefix: '03' },
      { ags: '03452', name: 'LK Aurich', stateAgsPrefix: '03' },
      { ags: '03453', name: 'LK Cloppenburg', stateAgsPrefix: '03' },
      { ags: '03454', name: 'LK Emsland', stateAgsPrefix: '03' },
      { ags: '03455', name: 'LK Friesland', stateAgsPrefix: '03' },
      {
        ags: '03456',
        name: 'LK Grafschaft Bentheim',
        stateAgsPrefix: '03'
      },
      { ags: '03457', name: 'LK Leer', stateAgsPrefix: '03' },
      { ags: '03458', name: 'LK Oldenburg', stateAgsPrefix: '03' },
      { ags: '03459', name: 'LK Osnabrück', stateAgsPrefix: '03' },
      { ags: '03460', name: 'LK Vechta', stateAgsPrefix: '03' },
      { ags: '03461', name: 'LK Wesermarsch', stateAgsPrefix: '03' },
      { ags: '03462', name: 'LK Wittmund', stateAgsPrefix: '03' }
    ]
  },
  {
    agsPrefix: '04',
    name: 'Bremen',
    districts: [
      { ags: '04011', name: 'SK Bremen', stateAgsPrefix: '04' },
      { ags: '04012', name: 'SK Bremerhaven', stateAgsPrefix: '04' }
    ]
  },
  {
    agsPrefix: '05',
    name: 'Nordrhein-Westfalen',
    districts: [
      { ags: '05111', name: 'SK Düsseldorf', stateAgsPrefix: '05' },
      { ags: '05112', name: 'SK Duisburg', stateAgsPrefix: '05' },
      { ags: '05113', name: 'SK Essen', stateAgsPrefix: '05' },
      { ags: '05114', name: 'SK Krefeld', stateAgsPrefix: '05' },
      {
        ags: '05116',
        name: 'SK Mönchengladbach',
        stateAgsPrefix: '05'
      },
      {
        ags: '05117',
        name: 'SK Mülheim a.d.Ruhr',
        stateAgsPrefix: '05'
      },
      { ags: '05119', name: 'SK Oberhausen', stateAgsPrefix: '05' },
      { ags: '05120', name: 'SK Remscheid', stateAgsPrefix: '05' },
      { ags: '05122', name: 'SK Solingen', stateAgsPrefix: '05' },
      { ags: '05124', name: 'SK Wuppertal', stateAgsPrefix: '05' },
      { ags: '05154', name: 'LK Kleve', stateAgsPrefix: '05' },
      { ags: '05158', name: 'LK Mettmann', stateAgsPrefix: '05' },
      {
        ags: '05162',
        name: 'LK Rhein-Kreis Neuss',
        stateAgsPrefix: '05'
      },
      { ags: '05166', name: 'LK Viersen', stateAgsPrefix: '05' },
      { ags: '05170', name: 'LK Wesel', stateAgsPrefix: '05' },
      { ags: '05314', name: 'SK Bonn', stateAgsPrefix: '05' },
      { ags: '05315', name: 'SK Köln', stateAgsPrefix: '05' },
      { ags: '05316', name: 'SK Leverkusen', stateAgsPrefix: '05' },
      {
        ags: '05334',
        name: 'StädteRegion Aachen',
        stateAgsPrefix: '05'
      },
      { ags: '05358', name: 'LK Düren', stateAgsPrefix: '05' },
      {
        ags: '05362',
        name: 'LK Rhein-Erft-Kreis',
        stateAgsPrefix: '05'
      },
      { ags: '05366', name: 'LK Euskirchen', stateAgsPrefix: '05' },
      { ags: '05370', name: 'LK Heinsberg', stateAgsPrefix: '05' },
      {
        ags: '05374',
        name: 'LK Oberbergischer Kreis',
        stateAgsPrefix: '05'
      },
      {
        ags: '05378',
        name: 'LK Rheinisch-Bergischer Kreis',
        stateAgsPrefix: '05'
      },
      {
        ags: '05382',
        name: 'LK Rhein-Sieg-Kreis',
        stateAgsPrefix: '05'
      },
      { ags: '05512', name: 'SK Bottrop', stateAgsPrefix: '05' },
      { ags: '05513', name: 'SK Gelsenkirchen', stateAgsPrefix: '05' },
      { ags: '05515', name: 'SK Münster', stateAgsPrefix: '05' },
      { ags: '05554', name: 'LK Borken', stateAgsPrefix: '05' },
      { ags: '05558', name: 'LK Coesfeld', stateAgsPrefix: '05' },
      { ags: '05562', name: 'LK Recklinghausen', stateAgsPrefix: '05' },
      { ags: '05566', name: 'LK Steinfurt', stateAgsPrefix: '05' },
      { ags: '05570', name: 'LK Warendorf', stateAgsPrefix: '05' },
      { ags: '05711', name: 'SK Bielefeld', stateAgsPrefix: '05' },
      { ags: '05754', name: 'LK Gütersloh', stateAgsPrefix: '05' },
      { ags: '05758', name: 'LK Herford', stateAgsPrefix: '05' },
      { ags: '05762', name: 'LK Höxter', stateAgsPrefix: '05' },
      { ags: '05766', name: 'LK Lippe', stateAgsPrefix: '05' },
      {
        ags: '05770',
        name: 'LK Minden-Lübbecke',
        stateAgsPrefix: '05'
      },
      { ags: '05774', name: 'LK Paderborn', stateAgsPrefix: '05' },
      { ags: '05911', name: 'SK Bochum', stateAgsPrefix: '05' },
      { ags: '05913', name: 'SK Dortmund', stateAgsPrefix: '05' },
      { ags: '05914', name: 'SK Hagen', stateAgsPrefix: '05' },
      { ags: '05915', name: 'SK Hamm', stateAgsPrefix: '05' },
      { ags: '05916', name: 'SK Herne', stateAgsPrefix: '05' },
      {
        ags: '05954',
        name: 'LK Ennepe-Ruhr-Kreis',
        stateAgsPrefix: '05'
      },
      {
        ags: '05958',
        name: 'LK Hochsauerlandkreis',
        stateAgsPrefix: '05'
      },
      {
        ags: '05962',
        name: 'LK Märkischer Kreis',
        stateAgsPrefix: '05'
      },
      { ags: '05966', name: 'LK Olpe', stateAgsPrefix: '05' },
      {
        ags: '05970',
        name: 'LK Siegen-Wittgenstein',
        stateAgsPrefix: '05'
      },
      { ags: '05974', name: 'LK Soest', stateAgsPrefix: '05' },
      { ags: '05978', name: 'LK Unna', stateAgsPrefix: '05' }
    ]
  },
  {
    agsPrefix: '06',
    name: 'Hessen',
    districts: [
      { ags: '06411', name: 'SK Darmstadt', stateAgsPrefix: '06' },
      {
        ags: '06412',
        name: 'SK Frankfurt am Main',
        stateAgsPrefix: '06'
      },
      { ags: '06413', name: 'SK Offenbach', stateAgsPrefix: '06' },
      { ags: '06414', name: 'SK Wiesbaden', stateAgsPrefix: '06' },
      { ags: '06431', name: 'LK Bergstraße', stateAgsPrefix: '06' },
      {
        ags: '06432',
        name: 'LK Darmstadt-Dieburg',
        stateAgsPrefix: '06'
      },
      { ags: '06433', name: 'LK Groß-Gerau', stateAgsPrefix: '06' },
      {
        ags: '06434',
        name: 'LK Hochtaunuskreis',
        stateAgsPrefix: '06'
      },
      {
        ags: '06435',
        name: 'LK Main-Kinzig-Kreis',
        stateAgsPrefix: '06'
      },
      {
        ags: '06436',
        name: 'LK Main-Taunus-Kreis',
        stateAgsPrefix: '06'
      },
      { ags: '06437', name: 'LK Odenwaldkreis', stateAgsPrefix: '06' },
      { ags: '06438', name: 'LK Offenbach', stateAgsPrefix: '06' },
      {
        ags: '06439',
        name: 'LK Rheingau-Taunus-Kreis',
        stateAgsPrefix: '06'
      },
      { ags: '06440', name: 'LK Wetteraukreis', stateAgsPrefix: '06' },
      { ags: '06531', name: 'LK Gießen', stateAgsPrefix: '06' },
      {
        ags: '06532',
        name: 'LK Lahn-Dill-Kreis',
        stateAgsPrefix: '06'
      },
      {
        ags: '06533',
        name: 'LK Limburg-Weilburg',
        stateAgsPrefix: '06'
      },
      {
        ags: '06534',
        name: 'LK Marburg-Biedenkopf',
        stateAgsPrefix: '06'
      },
      {
        ags: '06535',
        name: 'LK Vogelsbergkreis',
        stateAgsPrefix: '06'
      },
      { ags: '06611', name: 'SK Kassel', stateAgsPrefix: '06' },
      { ags: '06631', name: 'LK Fulda', stateAgsPrefix: '06' },
      {
        ags: '06632',
        name: 'LK Hersfeld-Rotenburg',
        stateAgsPrefix: '06'
      },
      { ags: '06633', name: 'LK Kassel', stateAgsPrefix: '06' },
      {
        ags: '06634',
        name: 'LK Schwalm-Eder-Kreis',
        stateAgsPrefix: '06'
      },
      {
        ags: '06635',
        name: 'LK Waldeck-Frankenberg',
        stateAgsPrefix: '06'
      },
      {
        ags: '06636',
        name: 'LK Werra-Meißner-Kreis',
        stateAgsPrefix: '06'
      }
    ]
  },
  {
    agsPrefix: '07',
    name: 'Rheinland-Pfalz',
    districts: [
      { ags: '07111', name: 'SK Koblenz', stateAgsPrefix: '07' },
      { ags: '07131', name: 'LK Ahrweiler', stateAgsPrefix: '07' },
      { ags: '07132', name: 'LK Altenkirchen', stateAgsPrefix: '07' },
      { ags: '07133', name: 'LK Bad Kreuznach', stateAgsPrefix: '07' },
      { ags: '07134', name: 'LK Birkenfeld', stateAgsPrefix: '07' },
      { ags: '07135', name: 'LK Cochem-Zell', stateAgsPrefix: '07' },
      { ags: '07137', name: 'LK Mayen-Koblenz', stateAgsPrefix: '07' },
      { ags: '07138', name: 'LK Neuwied', stateAgsPrefix: '07' },
      {
        ags: '07140',
        name: 'LK Rhein-Hunsrück-Kreis',
        stateAgsPrefix: '07'
      },
      {
        ags: '07141',
        name: 'LK Rhein-Lahn-Kreis',
        stateAgsPrefix: '07'
      },
      {
        ags: '07143',
        name: 'LK Westerwaldkreis',
        stateAgsPrefix: '07'
      },
      { ags: '07211', name: 'SK Trier', stateAgsPrefix: '07' },
      {
        ags: '07231',
        name: 'LK Bernkastel-Wittlich',
        stateAgsPrefix: '07'
      },
      { ags: '07232', name: 'LK Bitburg-Prüm', stateAgsPrefix: '07' },
      { ags: '07233', name: 'LK Vulkaneifel', stateAgsPrefix: '07' },
      { ags: '07235', name: 'LK Trier-Saarburg', stateAgsPrefix: '07' },
      { ags: '07311', name: 'SK Frankenthal', stateAgsPrefix: '07' },
      { ags: '07312', name: 'SK Kaiserslautern', stateAgsPrefix: '07' },
      {
        ags: '07313',
        name: 'SK Landau i.d.Pfalz',
        stateAgsPrefix: '07'
      },
      { ags: '07314', name: 'SK Ludwigshafen', stateAgsPrefix: '07' },
      { ags: '07315', name: 'SK Mainz', stateAgsPrefix: '07' },
      {
        ags: '07316',
        name: 'SK Neustadt a.d.Weinstraße',
        stateAgsPrefix: '07'
      },
      { ags: '07317', name: 'SK Pirmasens', stateAgsPrefix: '07' },
      { ags: '07318', name: 'SK Speyer', stateAgsPrefix: '07' },
      { ags: '07319', name: 'SK Worms', stateAgsPrefix: '07' },
      { ags: '07320', name: 'SK Zweibrücken', stateAgsPrefix: '07' },
      { ags: '07331', name: 'LK Alzey-Worms', stateAgsPrefix: '07' },
      { ags: '07332', name: 'LK Bad Dürkheim', stateAgsPrefix: '07' },
      {
        ags: '07333',
        name: 'LK Donnersbergkreis',
        stateAgsPrefix: '07'
      },
      { ags: '07334', name: 'LK Germersheim', stateAgsPrefix: '07' },
      { ags: '07335', name: 'LK Kaiserslautern', stateAgsPrefix: '07' },
      { ags: '07336', name: 'LK Kusel', stateAgsPrefix: '07' },
      {
        ags: '07337',
        name: 'LK Südliche Weinstraße',
        stateAgsPrefix: '07'
      },
      {
        ags: '07338',
        name: 'LK Rhein-Pfalz-Kreis',
        stateAgsPrefix: '07'
      },
      { ags: '07339', name: 'LK Mainz-Bingen', stateAgsPrefix: '07' },
      { ags: '07340', name: 'LK Südwestpfalz', stateAgsPrefix: '07' }
    ]
  },
  {
    agsPrefix: '08',
    name: 'Baden-Württemberg',
    districts: [
      { ags: '08111', name: 'SK Stuttgart', stateAgsPrefix: '08' },
      { ags: '08115', name: 'LK Böblingen', stateAgsPrefix: '08' },
      { ags: '08116', name: 'LK Esslingen', stateAgsPrefix: '08' },
      { ags: '08117', name: 'LK Göppingen', stateAgsPrefix: '08' },
      { ags: '08118', name: 'LK Ludwigsburg', stateAgsPrefix: '08' },
      {
        ags: '08119',
        name: 'LK Rems-Murr-Kreis',
        stateAgsPrefix: '08'
      },
      { ags: '08121', name: 'SK Heilbronn', stateAgsPrefix: '08' },
      { ags: '08125', name: 'LK Heilbronn', stateAgsPrefix: '08' },
      { ags: '08126', name: 'LK Hohenlohekreis', stateAgsPrefix: '08' },
      {
        ags: '08127',
        name: 'LK Schwäbisch Hall',
        stateAgsPrefix: '08'
      },
      {
        ags: '08128',
        name: 'LK Main-Tauber-Kreis',
        stateAgsPrefix: '08'
      },
      { ags: '08135', name: 'LK Heidenheim', stateAgsPrefix: '08' },
      { ags: '08136', name: 'LK Ostalbkreis', stateAgsPrefix: '08' },
      { ags: '08211', name: 'SK Baden-Baden', stateAgsPrefix: '08' },
      { ags: '08212', name: 'SK Karlsruhe', stateAgsPrefix: '08' },
      { ags: '08215', name: 'LK Karlsruhe', stateAgsPrefix: '08' },
      { ags: '08216', name: 'LK Rastatt', stateAgsPrefix: '08' },
      { ags: '08221', name: 'SK Heidelberg', stateAgsPrefix: '08' },
      { ags: '08222', name: 'SK Mannheim', stateAgsPrefix: '08' },
      {
        ags: '08225',
        name: 'LK Neckar-Odenwald-Kreis',
        stateAgsPrefix: '08'
      },
      {
        ags: '08226',
        name: 'LK Rhein-Neckar-Kreis',
        stateAgsPrefix: '08'
      },
      { ags: '08231', name: 'SK Pforzheim', stateAgsPrefix: '08' },
      { ags: '08235', name: 'LK Calw', stateAgsPrefix: '08' },
      { ags: '08236', name: 'LK Enzkreis', stateAgsPrefix: '08' },
      { ags: '08237', name: 'LK Freudenstadt', stateAgsPrefix: '08' },
      {
        ags: '08311',
        name: 'SK Freiburg i.Breisgau',
        stateAgsPrefix: '08'
      },
      {
        ags: '08315',
        name: 'LK Breisgau-Hochschwarzwald',
        stateAgsPrefix: '08'
      },
      { ags: '08316', name: 'LK Emmendingen', stateAgsPrefix: '08' },
      { ags: '08317', name: 'LK Ortenaukreis', stateAgsPrefix: '08' },
      { ags: '08325', name: 'LK Rottweil', stateAgsPrefix: '08' },
      {
        ags: '08326',
        name: 'LK Schwarzwald-Baar-Kreis',
        stateAgsPrefix: '08'
      },
      { ags: '08327', name: 'LK Tuttlingen', stateAgsPrefix: '08' },
      { ags: '08335', name: 'LK Konstanz', stateAgsPrefix: '08' },
      { ags: '08336', name: 'LK Lörrach', stateAgsPrefix: '08' },
      { ags: '08337', name: 'LK Waldshut', stateAgsPrefix: '08' },
      { ags: '08415', name: 'LK Reutlingen', stateAgsPrefix: '08' },
      { ags: '08416', name: 'LK Tübingen', stateAgsPrefix: '08' },
      {
        ags: '08417',
        name: 'LK Zollernalbkreis',
        stateAgsPrefix: '08'
      },
      { ags: '08421', name: 'SK Ulm', stateAgsPrefix: '08' },
      {
        ags: '08425',
        name: 'LK Alb-Donau-Kreis',
        stateAgsPrefix: '08'
      },
      { ags: '08426', name: 'LK Biberach', stateAgsPrefix: '08' },
      { ags: '08435', name: 'LK Bodenseekreis', stateAgsPrefix: '08' },
      { ags: '08436', name: 'LK Ravensburg', stateAgsPrefix: '08' },
      { ags: '08437', name: 'LK Sigmaringen', stateAgsPrefix: '08' }
    ]
  },
  {
    agsPrefix: '09',
    name: 'Bayern',
    districts: [
      { ags: '09161', name: 'SK Ingolstadt', stateAgsPrefix: '09' },
      { ags: '09162', name: 'SK München', stateAgsPrefix: '09' },
      { ags: '09163', name: 'SK Rosenheim', stateAgsPrefix: '09' },
      { ags: '09171', name: 'LK Altötting', stateAgsPrefix: '09' },
      {
        ags: '09172',
        name: 'LK Berchtesgadener Land',
        stateAgsPrefix: '09'
      },
      {
        ags: '09173',
        name: 'LK Bad Tölz-Wolfratshausen',
        stateAgsPrefix: '09'
      },
      { ags: '09174', name: 'LK Dachau', stateAgsPrefix: '09' },
      { ags: '09175', name: 'LK Ebersberg', stateAgsPrefix: '09' },
      { ags: '09176', name: 'LK Eichstätt', stateAgsPrefix: '09' },
      { ags: '09177', name: 'LK Erding', stateAgsPrefix: '09' },
      { ags: '09178', name: 'LK Freising', stateAgsPrefix: '09' },
      {
        ags: '09179',
        name: 'LK Fürstenfeldbruck',
        stateAgsPrefix: '09'
      },
      {
        ags: '09180',
        name: 'LK Garmisch-Partenkirchen',
        stateAgsPrefix: '09'
      },
      {
        ags: '09181',
        name: 'LK Landsberg a.Lech',
        stateAgsPrefix: '09'
      },
      { ags: '09182', name: 'LK Miesbach', stateAgsPrefix: '09' },
      { ags: '09183', name: 'LK Mühldorf a.Inn', stateAgsPrefix: '09' },
      { ags: '09184', name: 'LK München', stateAgsPrefix: '09' },
      {
        ags: '09185',
        name: 'LK Neuburg-Schrobenhausen',
        stateAgsPrefix: '09'
      },
      {
        ags: '09186',
        name: 'LK Pfaffenhofen a.d.Ilm',
        stateAgsPrefix: '09'
      },
      { ags: '09187', name: 'LK Rosenheim', stateAgsPrefix: '09' },
      { ags: '09188', name: 'LK Starnberg', stateAgsPrefix: '09' },
      { ags: '09189', name: 'LK Traunstein', stateAgsPrefix: '09' },
      {
        ags: '09190',
        name: 'LK Weilheim-Schongau',
        stateAgsPrefix: '09'
      },
      { ags: '09261', name: 'SK Landshut', stateAgsPrefix: '09' },
      { ags: '09262', name: 'SK Passau', stateAgsPrefix: '09' },
      { ags: '09263', name: 'SK Straubing', stateAgsPrefix: '09' },
      { ags: '09271', name: 'LK Deggendorf', stateAgsPrefix: '09' },
      {
        ags: '09272',
        name: 'LK Freyung-Grafenau',
        stateAgsPrefix: '09'
      },
      { ags: '09273', name: 'LK Kelheim', stateAgsPrefix: '09' },
      { ags: '09274', name: 'LK Landshut', stateAgsPrefix: '09' },
      { ags: '09275', name: 'LK Passau', stateAgsPrefix: '09' },
      { ags: '09276', name: 'LK Regen', stateAgsPrefix: '09' },
      { ags: '09277', name: 'LK Rottal-Inn', stateAgsPrefix: '09' },
      {
        ags: '09278',
        name: 'LK Straubing-Bogen',
        stateAgsPrefix: '09'
      },
      {
        ags: '09279',
        name: 'LK Dingolfing-Landau',
        stateAgsPrefix: '09'
      },
      { ags: '09361', name: 'SK Amberg', stateAgsPrefix: '09' },
      { ags: '09362', name: 'SK Regensburg', stateAgsPrefix: '09' },
      {
        ags: '09363',
        name: 'SK Weiden i.d.OPf.',
        stateAgsPrefix: '09'
      },
      {
        ags: '09371',
        name: 'LK Amberg-Sulzbach',
        stateAgsPrefix: '09'
      },
      { ags: '09372', name: 'LK Cham', stateAgsPrefix: '09' },
      {
        ags: '09373',
        name: 'LK Neumarkt i.d.OPf.',
        stateAgsPrefix: '09'
      },
      {
        ags: '09374',
        name: 'LK Neustadt a.d.Waldnaab',
        stateAgsPrefix: '09'
      },
      { ags: '09375', name: 'LK Regensburg', stateAgsPrefix: '09' },
      { ags: '09376', name: 'LK Schwandorf', stateAgsPrefix: '09' },
      { ags: '09377', name: 'LK Tirschenreuth', stateAgsPrefix: '09' },
      { ags: '09461', name: 'SK Bamberg', stateAgsPrefix: '09' },
      { ags: '09462', name: 'SK Bayreuth', stateAgsPrefix: '09' },
      { ags: '09463', name: 'SK Coburg', stateAgsPrefix: '09' },
      { ags: '09464', name: 'SK Hof', stateAgsPrefix: '09' },
      { ags: '09471', name: 'LK Bamberg', stateAgsPrefix: '09' },
      { ags: '09472', name: 'LK Bayreuth', stateAgsPrefix: '09' },
      { ags: '09473', name: 'LK Coburg', stateAgsPrefix: '09' },
      { ags: '09474', name: 'LK Forchheim', stateAgsPrefix: '09' },
      { ags: '09475', name: 'LK Hof', stateAgsPrefix: '09' },
      { ags: '09476', name: 'LK Kronach', stateAgsPrefix: '09' },
      { ags: '09477', name: 'LK Kulmbach', stateAgsPrefix: '09' },
      { ags: '09478', name: 'LK Lichtenfels', stateAgsPrefix: '09' },
      {
        ags: '09479',
        name: 'LK Wunsiedel i.Fichtelgebirge',
        stateAgsPrefix: '09'
      },
      { ags: '09561', name: 'SK Ansbach', stateAgsPrefix: '09' },
      { ags: '09562', name: 'SK Erlangen', stateAgsPrefix: '09' },
      { ags: '09563', name: 'SK Fürth', stateAgsPrefix: '09' },
      { ags: '09564', name: 'SK Nürnberg', stateAgsPrefix: '09' },
      { ags: '09565', name: 'SK Schwabach', stateAgsPrefix: '09' },
      { ags: '09571', name: 'LK Ansbach', stateAgsPrefix: '09' },
      {
        ags: '09572',
        name: 'LK Erlangen-Höchstadt',
        stateAgsPrefix: '09'
      },
      { ags: '09573', name: 'LK Fürth', stateAgsPrefix: '09' },
      {
        ags: '09574',
        name: 'LK Nürnberger Land',
        stateAgsPrefix: '09'
      },
      {
        ags: '09575',
        name: 'LK Neustadt a.d.Aisch-Bad Windsheim',
        stateAgsPrefix: '09'
      },
      { ags: '09576', name: 'LK Roth', stateAgsPrefix: '09' },
      {
        ags: '09577',
        name: 'LK Weißenburg-Gunzenhausen',
        stateAgsPrefix: '09'
      },
      { ags: '09661', name: 'SK Aschaffenburg', stateAgsPrefix: '09' },
      { ags: '09662', name: 'SK Schweinfurt', stateAgsPrefix: '09' },
      { ags: '09663', name: 'SK Würzburg', stateAgsPrefix: '09' },
      { ags: '09671', name: 'LK Aschaffenburg', stateAgsPrefix: '09' },
      { ags: '09672', name: 'LK Bad Kissingen', stateAgsPrefix: '09' },
      { ags: '09673', name: 'LK Rhön-Grabfeld', stateAgsPrefix: '09' },
      { ags: '09674', name: 'LK Haßberge', stateAgsPrefix: '09' },
      { ags: '09675', name: 'LK Kitzingen', stateAgsPrefix: '09' },
      { ags: '09676', name: 'LK Miltenberg', stateAgsPrefix: '09' },
      { ags: '09677', name: 'LK Main-Spessart', stateAgsPrefix: '09' },
      { ags: '09678', name: 'LK Schweinfurt', stateAgsPrefix: '09' },
      { ags: '09679', name: 'LK Würzburg', stateAgsPrefix: '09' },
      { ags: '09761', name: 'SK Augsburg', stateAgsPrefix: '09' },
      { ags: '09762', name: 'SK Kaufbeuren', stateAgsPrefix: '09' },
      { ags: '09763', name: 'SK Kempten', stateAgsPrefix: '09' },
      { ags: '09764', name: 'SK Memmingen', stateAgsPrefix: '09' },
      {
        ags: '09771',
        name: 'LK Aichach-Friedberg',
        stateAgsPrefix: '09'
      },
      { ags: '09772', name: 'LK Augsburg', stateAgsPrefix: '09' },
      {
        ags: '09773',
        name: 'LK Dillingen a.d.Donau',
        stateAgsPrefix: '09'
      },
      { ags: '09774', name: 'LK Günzburg', stateAgsPrefix: '09' },
      { ags: '09775', name: 'LK Neu-Ulm', stateAgsPrefix: '09' },
      { ags: '09776', name: 'LK Lindau', stateAgsPrefix: '09' },
      { ags: '09777', name: 'LK Ostallgäu', stateAgsPrefix: '09' },
      { ags: '09778', name: 'LK Unterallgäu', stateAgsPrefix: '09' },
      { ags: '09779', name: 'LK Donau-Ries', stateAgsPrefix: '09' },
      { ags: '09780', name: 'LK Oberallgäu', stateAgsPrefix: '09' }
    ]
  }
]
Done in 2.78s.
```

## Sources

### data/corona-api-06-04-2022.json:

Robert Koch-Institut COVID-19 API - von Marlon Lückert  
Docs: [https://api.corona-zahlen.org/docs/](https://api.corona-zahlen.org/docs/)  
Exact route: [https://api.corona-zahlen.org/districts](https://api.corona-zahlen.org/districts) (visited on April 6th 2022)  
Modifications: prettified with https://jsonformatter.curiousconcept.com/  
Licence (CC BY 4.0)
