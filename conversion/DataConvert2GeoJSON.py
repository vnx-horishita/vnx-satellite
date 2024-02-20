import os
import sys
import json
import codecs
import pandas as pd

#文字コードを設定
encode_type = input('Encode type = UTF-8 : 1 / UTF-16 : 2 / Shift-JIS : 3 >> ')

if encode_type == "1":
    encode_flag = 'utf_8'
elif encode_type == "2":
    encode_flag = 'utf_16'
elif encode_type == "3":
    encode_flag = 'shift_jis'
else:
    encode_flag = 'utf_8'
    print('Encodeing type is set to UTF-8, due to invalid input.')

#ファイル名のパスを入力
file_name = input('Input csv file >> ')

if not os.path.exists(file_name): #ファイルの存在を確認し、なければエラー表示して終了させる。
    print('Program aborted due to invalid input. Please enter the correct filename.')
    sys.exit()

base_name = os.path.splitext(os.path.basename(file_name))[0] #拡張子なしファイル名を格納
ext_name = os.path.splitext(file_name)[1] #拡張子を取得

if ext_name == '.csv':
    with codecs.open(file_name, 'r', encode_flag, 'ignore') as f:
        f_quote = '\'' if f.read(1) == '\'' else '\"' #ファイルの最初の文字がシングルクォーテーションの場合があるため引用符を判定
        with codecs.open(file_name, 'r', encode_flag, 'ignore') as f: #本来は読み込み一回で済ませたいがf.readでfがスライスされるため再読み込み
            df_1 = pd.read_csv(f, quotechar=f_quote, dtype={"cl#":int}) 
else: #タブ区切りで.txtまたは.tsvを想定
    with codecs.open(file_name, 'r', encode_flag, 'ignore') as f:
        df_1 = pd.read_csv(f, sep='\t', dtype={"cl#":int})

print(df_1.info())

#データの中にIDの列名があるか判定し、公開番号またはpatent no.であればそれをIDに変換、それ以外はエラー
if "ID" in df_1.columns:
    pass
elif "patent no." in df_1.columns:
    df_1['ID'] = df_1['patent no.']
elif "公開番号" in df_1.columns:
    df_1['ID'] = df_1['公開番号']
else:
    print('Program aborted due to invalid input. Please make sure the "ID" or relevant column is included.')
    sys.exit()

#データの中にyearの列名があるか判定し、ない場合は直接入力、入力した項目が存在しない場合はエラー
if "year" in df_1.columns:
    pass
else:
    year_col = input('Input column name for year, or press Enter-key if "year" column exists >> ')
    if year_col in df_1.columns:
        df_1['year'] = df_1[year_col]
    else:
        print('Program aborted due to invalid input. Please make sure the column exists.')
        sys.exit()

#データの中にTitleの列名があるか判定し、ない場合は直接入力、入力した項目が存在しない場合はエラー
if "Title" in df_1.columns:
    pass
elif "title" in df_1.columns:
    df_1['Title'] = df_1['title']
elif "タイトル" in df_1.columns:
    df_1['Title'] = df_1['タイトル']
elif "名称" in df_1.columns:
    df_1['Title'] = df_1['名称']
else:
    title_col = input('Input column name for title >> ')
    if title_col in df_1.columns:
        df_1['Title'] = df_1[title_col]
    else:
        print('Program aborted due to invalid input. Please make sure the column exists.')
        sys.exit()

#データの中にAbstractの列名があるか判定し、ない場合は直接入力、入力した項目が存在しない場合はエラー
if "Abstract" in df_1.columns:
    pass
elif "abstract" in df_1.columns:
    df_1['Abstract'] = df_1['abstract']
elif "要約" in df_1.columns:
    df_1['Abstract'] = df_1['要約']
elif "抄録" in df_1.columns:
    df_1['Abstract'] = df_1['抄録']
else:
    abstract_col = input('Input column name for abstract >> ')
    if abstract_col in df_1.columns:
        df_1['Abstract'] = df_1[abstract_col]
    else:
        print('Program aborted due to invalid input. Please make sure the column exists.')
        sys.exit()

#組織名のカラムを指定
if "applicants" in df_1.columns:
    df_1['Affiliation'] = df_1['applicants']
else:
    aff_col = input('Input column name for affiliation >> ')
    if aff_col in df_1.columns:
        df_1['Affiliation'] = df_1[aff_col]
    else:
        print('Program aborted due to invalid input. Please make sure the column exists.')
        sys.exit()

#xy座標値の列名が大文字だった場合は補正
try:
    if "X" in df_1.columns and not "x" in df_1.columns:
        df_1['x'] = df_1['X']
        df_1['y'] = df_1['Y']
    else: #xy列の存在チェック。スマートな方法があれば修正。
        df_1['x'] = df_1['x']
        df_1['y'] = df_1['y']
except:
    print('Program aborted due to invalid input. Please make sure the "x/X" and "y/Y" column is included.')
    sys.exit()

#データの中に特徴語の列名があるか判定し、適宜穴埋め補完する
"""
if "characteristic words" in df_1.columns:
    df_1['characteristic_words'] = df_1['characteristic words'].fillna(method='ffill')
    df_1['characteristic words'] = df_1['characteristic words'].fillna(method='ffill')
elif "特徴語" in df_1.columns:
    df_1['characteristic_words'] = df_1['特徴語'].fillna(method='ffill')
    df_1['特徴語'] = df_1['特徴語'].fillna(method='ffill')
else:
    print('Program aborted due to invalid input. Please make sure the "特徴語" or relevant column is included.')
    sys.exit()

#データの中に複合語の列名があれば穴埋め補完する
if "characteristic compound words" in df_1.columns:
    df_1['characteristic compound words'] = df_1['characteristic compound words'].fillna(method='ffill')
elif "複合語" in df_1.columns:
    df_1['複合語'] = df_1['複合語'].fillna(method='ffill')
else:
    print('Program aborted due to invalid input. Please make sure the "複合語" or relevant column is included.')
    sys.exit()
"""

keep_list = list(dict.fromkeys(["ID","x","y","year","Title","Abstract","Affiliation"])) #重複項目をマージしたリストを作成(ID列を一列目にするなど列順番を変更しないようにdictを利用（注：python3.6以下では順番変わる可能性あり）)
df_1 = df_1.loc[:, keep_list] #必要な列のみを別のデータフレームに残す（メモリ負荷低減のため）
df_sorted = df_1.sort_values(by="year", ascending=False) # "year"列に基づいて降順に並べ替え
"""
with open("doc.csv", mode="w", encoding='utf_8', errors="ignore", newline="") as f:
    df_1.to_csv(f, index=False)

print("Check the output file named doc.csv")
"""
features = []
for index, row in df_sorted.iterrows():
    feature = {
        "type": "Feature",
        "geometry": {
        "type": "Point",
        "coordinates": [row['x'], row['y']]
        },
        "properties": {
        "ID": row['ID'],
        "year": row['year'],
        "Affiliation": row['Affiliation'],
        "Title": row['Title'],
        "Abstract": row['Abstract'],
        }
    }
    features.append(feature)

with open("doc.geojson", "w", encoding='utf_8') as f:
    json.dump({"type": "FeatureCollection", "name": "label", "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } }, "features": features}, f, indent=2, ensure_ascii=False)

print("Done. Check the output file named doc.geojson")
