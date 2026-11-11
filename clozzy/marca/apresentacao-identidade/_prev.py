import fitz,os,sys
d=fitz.open("manual-identidade-clozzy.pdf"); print(len(d))
os.makedirs("/tmp/m",exist_ok=True)
for i,p in enumerate(d): p.get_pixmap(dpi=int(sys.argv[1]) if len(sys.argv)>1 else 60).save(f"/tmp/m/p{i+1:02d}.png")
