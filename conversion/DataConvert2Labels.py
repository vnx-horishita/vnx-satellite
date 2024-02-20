import hdbscan
import os
import sys
import json
import codecs
import collections
import pandas as pd
import numpy as np

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
if "characteristic words" in df_1.columns:
    df_1['characteristic_words'] = df_1['characteristic words'].fillna(method='ffill')
    #df_1['characteristic words'] = df_1['characteristic words'].fillna(method='ffill')
elif "特徴語" in df_1.columns:
    df_1['characteristic_words'] = df_1['特徴語'].fillna(method='ffill')
    #df_1['特徴語'] = df_1['特徴語'].fillna(method='ffill')
else:
    print('Program aborted due to invalid input. Please make sure the "特徴語" or relevant column is included.')
    sys.exit()

#データの中に複合語の列名があれば穴埋め補完する
if "characteristic compound words" in df_1.columns:
    df_1['characteristic_compound_words'] = df_1['characteristic compound words'].fillna(method='ffill')
elif "複合語" in df_1.columns:
    df_1['characteristic_compound_words'] = df_1['複合語'].fillna(method='ffill')
else:
    print('Program aborted due to invalid input. Please make sure the "複合語" or relevant column is included.')
    sys.exit()

keep_list = list(dict.fromkeys(["ID","x","y","year","characteristic_words","characteristic_compound_words"])) #重複項目をマージしたリストを作成(ID列を一列目にするなど列順番を変更しないようにdictを利用（注：python3.6以下では順番変わる可能性あり）)
df_1 = df_1.loc[:, keep_list] #必要な列のみを別のデータフレームに残す（メモリ負荷低減のため）

#clustering
clst_input = input('Input the number for min-size of a cluster (default=100) >> ')
try:
    clusters = int(clst_input)
except:
    clusters = 100 #set default value
    print("The minimum size of a cluster is set to 100, due to invalid input")

type_input = input('Input type of clustering - eom:1 or leaf:2 >> ')
if type_input == "1":
    type_c = 'eom'
elif type_input == "2":
    type_c = 'leaf'
else:
    type_c = 'leaf' #set default value
    print("Type of clustering is set to leaf, due to invalid input.")

#clustering
clustering = hdbscan.HDBSCAN(cluster_selection_method=type_c, min_cluster_size=clusters, min_samples=10) #The lower the value, the less noise you’ll get
log_method = "HDBSCAN (minimum size of clusters: " + str(clusters) + " ) / Type: " + type_c

log_list = [] # set an empty list for log
label_list = [] # set an empty list for labelled area file
log_list.append(log_method) #log the method of clustering

#Extract only XY coordinates from DataFrame for clustering calculation
df_xy = df_1.loc[:, ['x', 'y']]

#Convert XY coordicates into numpy array
X = df_xy.to_numpy()
log_doc = "Documents : " + str(X.shape[0]) #log the number of documents
log_list.append(log_doc)
print(log_doc) #display the number of documents

#Execution of clustering (using scikit-learn based modules)
clustering.fit(X)

#Store the label data
labels = clustering.labels_
num_labels = len(set(labels)) - (1 if -1 in labels else 0) #the number of labels
outliers = list(labels).count(-1) #the number of outliers
log_label = "labels : " + str(num_labels) + ", outliers : " + str(outliers) #log the number of labels and outliers
log_list.append(log_label)
print(log_label) #display the number of labels and outliers

#Create DataFrame of ID and Label No
embedding = pd.DataFrame()
embedding["id"] = df_1["ID"]
embedding["keywords"] = df_1["characteristic_words"]
embedding["X"] = df_1["x"]
embedding["Y"] = df_1["y"]
embedding["year"] = df_1["year"]
embedding["label"] = labels
#embedding["area_label"] = "No." + embedding["label" + 1].astype(str) + "-area"

#Feature words extraction
num = 0
log_head = "area_id" + '\t' + "documents" + '\t' + "recent_num" + '\t' + "X" + '\t' + "Y" + '\t' + "label" #log header
log_list.append(log_head)
label_list.append(log_head)
features = []#GeoJSON用

while num < num_labels:
    f_list = [] #empty list for storing all feature-words of documents
    embedding2 = embedding.query("label == @num") #filtering the columns by the label
    #convert the filtered feature words into array
    fwords = np.array(embedding2['keywords'])
    s = fwords.T
    #add feature words into list removing separator bar
    for i in s:
        try: #exception for avoiding errors due to unexpected value for feature words
            l = [x.strip() for x in i.split('|')]
            f_list.extend(l)
        except:
            pass
    #count the frequency of feature words by each label
    c = collections.Counter(f_list)
    top_c = c.most_common(15)[0:14]
    #count the number of documents in each label
    doc_n = len(embedding2)
    doc_a = len(embedding2.query("year > 2019")) #直近の件数を格納する。年次は入力方式にしても良い
    #caluculate centroid coordinates
    x_mean = embedding2["X"].mean()
    y_mean = embedding2["Y"].mean()
    #tag name for each label based on top2 with rate
    l_key1 = top_c[0][0] + "/" + top_c[1][0] + "/" + top_c[2][0]
    l_key2 = [k for k, v in top_c[3:] if v / doc_n > 0.4 and v / doc_n < 0.65]
    if len(l_key2) > 0:
        l_keys = l_key1 + "/" + l_key2[0]
    else:
        l_keys = l_key1
    #create log data of each label
    log_fwords = str(num) + "\t" + str(doc_n) + "\t" + str(doc_a) + "\t" + str(round(x_mean, 4)) + "\t" + str(round(y_mean, 4)) + "\t" + str(l_keys) #log the feature words of areas
    log_list.append(log_fwords)
    label_list.append(log_fwords)
    feature = {"type": "Feature", "geometry": {"type": "Point", "coordinates": [round(x_mean, 4), round(y_mean, 4)]},
        "properties": {
            "ID": num,
            "size1": doc_n,
            "size2": doc_a,
            "label": str(l_keys),
        }
    }
    features.append(feature)
    print(log_fwords) #display the feature words of areas
    num += 1

#export log
log_file = "log_" + str(num_labels) + ".txt"
with open(base_name + "_" + log_file, 'w', encoding="utf_8") as t:
    t.write("\n".join(log_list))

#export XY centroid of the labelled areas
label_name = "label_" + str(num_labels) + ".tsv"
with open(base_name + "_" + label_name, 'w', encoding="utf_8") as t:
    t.write("\n".join(label_list))

with open("label.geojson", "w", encoding='utf_8') as f:
    json.dump({"type": "FeatureCollection", "name": "label", "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } }, "features": features}, f, indent=2, ensure_ascii=False)

print("Done. Check the output file named label.geojson")

'''
for row in label_list:
    print(row)
    feature = {
        "type": "Feature",
        "geometry": {
        "type": "Point",
        "coordinates": [row['X'], row['Y']]
        },
        "properties": {
        "ID": row['area_id'],
        "size1": row['documents'],
        "size2": row['recent_num'],
        "label": row['label'],
        }
    }
    features.append(feature)
'''
