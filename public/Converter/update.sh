#!/usr/bin/env bash

declare -A units
declare -A extra
units=(["length"]='"m","cm","mm","angstrom"' ["volume"]='"m3","cm3","L","mL"' ["mass"]='"kg","g","mg","lb"' ["pressure"]='"Pa","atm","psi","torr","mmHg"' ["temperature"]='"K","degC","degF"' ["energy"]='"J","cal","kcal","eV","nm"' ["astro"]='"au","ly","pc","m"' ["atomic"]='"angstrom","nm","pm"')
extra=(["length"]='"ft","in","mi",' ["volume"]='' ["mass"]='' ["pressure"]='' ["temperature"]='' ["energy"]='' ["astro"]='"km","mi"' ["atomic"]='"m"')
temp_file=$(mktemp -p . --suffix .js)

echo "Bundling..."
if true
then
echo "Minifying..."
browserify ./Converter.js -d -t [ babelify --presets [ env react ] ] | uglifyjs -c > bundle.js
else
browserify "./Converter.js" -o bundle.js -d -t [ babelify --presets [ env react ] ]
fi
echo "Bundle Created"

for unit in "${!units[@]}";
do
echo ${unit}:${units[$unit]}

cp bundle.js ${temp_file}
sed -i "s/\"whimsical\"/${units[$unit]}/g" ${temp_file}
sed -i "s/\"literature\"/${extra[$unit]}/g" ${temp_file}
sed -i "s/howtoberandom/${unit}/g" ${temp_file}

cat ${temp_file} >./out/$unit.html

cat >./test/${unit}.html <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Converter</title>
</head>
<body>

<script>
EOF

cat ./out/$unit.html >>./test/${unit}.html

cat >>./test/${unit}.html <<EOF
</script>
</body>
</html>
EOF

echo "done" ./out/${unit}.html

done

date "+%D %r"

#create composite
cat >./test/index.html <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Converter</title>
</head>
<body>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/3.16.3/math.min.js"></script>

EOF
for unit in "${!units[@]}";
do
cat >>./test/index.html <<EOF

<script>
EOF

cat ./out/$unit.html >>./test/index.html

cat >>./test/index.html <<EOF
</script>

EOF
done

cat >>./test/index.html <<EOF
</body>
</html>
EOF

cd out
cp * ../public
cd ../public
for f in *.html; do
mv -- "$f" "${f%.html}.js"
done
cd ..

rm ${temp_file}
exit