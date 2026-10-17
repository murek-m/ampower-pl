"""Prywatny generator PDF z bezpiecznego eksportu oferty, bez wysyłki."""
import argparse, json, os
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def generate(source, destination, font_path, allow_draft=False):
    data = json.loads(Path(source).read_text())
    allowed = {'inquiryId','revision','state','issuedAt','validUntil','customer','lines','totals','terms','exclusions','approvalHash','demo','warrantyTerms','serviceTerms'}
    if set(data) - allowed or data.get('state') not in ('draft','approved'):
        raise ValueError('Użyj eksportu customerOffer, bez danych kosztowych')
    if data['state'] != 'approved' and not allow_draft:
        raise ValueError('Niezatwierdzona oferta: podgląd wymaga --draft')
    if data['state'] == 'approved' and not data.get('approvalHash'):
        raise ValueError('Brak śladu zatwierdzenia')
    line_keys = {'id','label','group','quantity','netCents','vatRate','vatCents','manufacturer','model'}
    if any(set(l) - line_keys for l in data['lines']):
        raise ValueError('Niedozwolone pola pozycji')
    pdfmetrics.registerFont(TTFont('Ampower', str(font_path)))
    bold = Path(font_path).with_name('Arial Bold.ttf' if Path(font_path).name == 'Arial.ttf' else 'DejaVuSans-Bold.ttf')
    pdfmetrics.registerFont(TTFont('AmpowerBold', str(bold if bold.exists() else font_path)))
    styles = getSampleStyleSheet()
    for style in styles.byName.values():
        style.fontName = 'Ampower'
    styles.add(ParagraphStyle(name='Copy',fontName='Ampower',fontSize=9,leading=14,spaceAfter=7,textColor=colors.HexColor('#181613')))
    styles.add(ParagraphStyle(name='Cell',fontName='Ampower',fontSize=8,leading=11))
    styles.add(ParagraphStyle(name='Number',parent=styles['Cell'],alignment=TA_RIGHT))
    styles.add(ParagraphStyle(name='Hero',fontName='AmpowerBold',fontSize=23,leading=29,spaceAfter=10))
    styles.add(ParagraphStyle(name='Section',fontName='AmpowerBold',fontSize=12,leading=17,spaceBefore=12,spaceAfter=7))
    money = lambda n: f'{n:,.2f}'.replace(',', ' ').replace('.', ',') + ' zł'
    p = lambda txt,style='Copy': Paragraph(escape(str(txt)).replace('\n','<br/>'),styles[style])
    story=[p('Oferta handlowa','Hero'),p(f"Numer: {data['inquiryId']} / {data['revision']}"),p(f"Data: {data['issuedAt'][:10]} | Ważność do: {data['validUntil'][:10]}"),Spacer(1,8)]
    if data['state']=='draft' or data.get('demo'):
        status = 'PODGLĄD ROBOCZY - NIEZATWIERDZONA OFERTA' if data['state']=='draft' else 'DEMONSTRACJA - ZATWIERDZENIE WYŁĄCZNIE LOKALNE'
        stamp=Table([[p(status)]],colWidths=[499])
        stamp.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#fff3b0')),('BOX',(0,0),(-1,-1),.6,colors.HexColor('#b27a00')),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
        story += [stamp,Spacer(1,12)]
    customer=data['customer']
    story += [p('Dane klienta','Section'),p(customer['name']),p(customer['email']),*([p('Telefon: '+customer['phone'])] if customer.get('phone') else []),p('Lokalizacja: '+customer['locality']),p('Zakres prac i sprzętu','Section')]
    rows=[[p('Pozycja','Cell'),p('Ilość','Number'),p('Netto','Number'),p('VAT','Number'),p('Brutto','Number')]]
    for l in data['lines']:
        identity = ' '.join(str(l.get(k,'')) for k in ['manufacturer','model']).strip()
        label = l['label'] + ('\n' + identity if identity and identity not in l['label'] else '')
        rows.append([p(label,'Cell'),p(l['quantity'],'Number'),p(money(l['netCents']/100),'Number'),p(f"{l['vatRate']}%",'Number'),p(money((l['netCents']+l['vatCents'])/100),'Number')])
    table=Table(rows,colWidths=[249,35,85,40,90],repeatRows=1,hAlign='LEFT')
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#f4e04d')),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),.5,colors.HexColor('#181613')),('LINEBELOW',(0,1),(-1,-1),.3,colors.HexColor('#d2cec2')),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)]))
    story.append(table)
    totals=data['totals']
    story += [Spacer(1,12),KeepTogether([p('Cena końcowa brutto: '+money(totals['gross']),'Section'),p('Netto: '+money(totals['net'])+' | VAT: '+money(totals['vat']))]),p('Warunki i zakres uzgodnień','Section'),p(data['terms']),p('Wyłączenia','Section'),p(data['exclusions'])]
    for key,title in [('warrantyTerms','Warunki gwarancji'),('serviceTerms','Warunki serwisu')]:
        if data.get(key): story += [p(title,'Section'),p(data[key])]
    def page(c,doc):
        w,h=A4
        c.setFillColor(colors.HexColor('#181613'));c.rect(0,h-71,w,71,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#f4e04d'));c.roundRect(48,h-52,30,30,6,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#181613'))
        path=c.beginPath();path.moveTo(65,h-25);path.lineTo(56,h-39);path.lineTo(62,h-39);path.lineTo(60,h-48);path.lineTo(72,h-34);path.lineTo(66,h-34);path.close();c.drawPath(path,fill=1,stroke=0)
        c.setFont('AmpowerBold',18);c.setFillColor(colors.white);c.drawString(90,h-43,'AMPOWER')
        c.setFont('Ampower',8);c.drawRightString(w-48,h-40,'Smart Home & Energy')
        if data['state']=='draft' or data.get('demo'):
            c.setFont('Ampower',8);c.setFillColor(colors.HexColor('#6b6357'))
            c.drawRightString(w-48,h-85,'WERSJA ROBOCZA' if data['state']=='draft' else 'DANE DEMONSTRACYJNE')
        c.setFillColor(colors.HexColor('#6b6357'));c.setFont('Ampower',7)
        c.drawString(48,43,'AmPower Jakub Babiej | NIP 5020121689 | kuba@ampower.pl | 785 668 797')
        c.drawString(48,31,'Czerńczyce 1/2, 59-150 Grębocice')
        c.drawRightString(w-48,31,f'Strona {doc.page}')
    dest=Path(destination);dest.parent.mkdir(parents=True,exist_ok=True)
    doc=SimpleDocTemplate(str(dest),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=95,bottomMargin=65,title='AMPOWER - Smart Home & Energy',author='AMPOWER')
    doc.build(story,onFirstPage=page,onLaterPages=page)
    os.chmod(dest,0o600)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('source');parser.add_argument('destination');parser.add_argument('--font',required=True);parser.add_argument('--draft',action='store_true')
    args=parser.parse_args();generate(args.source,args.destination,args.font,args.draft)
