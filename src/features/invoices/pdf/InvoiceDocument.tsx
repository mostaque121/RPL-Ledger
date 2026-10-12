/**
 * The invoice PDF (@react-pdf/renderer). Loaded on demand with `render.tsx`, never in the main bundle.
 * Money comes in as integer cents; totals come from `invoiceTotals` like everywhere else.
 */
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { format, parseISO } from 'date-fns'
// Inlined as a data URI, so rendering never depends on fetching a file.
import logoUrl from '@/assets/invoice-logo.png?inline'
import { invoiceLineAmount, invoiceTotals } from '@/lib/accounting'
import type { Cents } from '@/lib/money'
import type { InvoiceDocumentData } from '../schema'

// Keep words whole (the default splits long words with hyphens).
Font.registerHyphenationCallback((word) => [word])

// ── Helpers ──────────────────────────────────────────────────────────────────

const number = new Intl.NumberFormat('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt = (cents: Cents) => `$${number.format(cents / 100)}`
const longDate = (iso: string) => format(parseISO(iso), 'dd MMMM yyyy')
const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

// ── Palette ──────────────────────────────────────────────────────────────────

const GREEN = '#2e7d32'
const LIGHT_GREEN = '#e8f5e9'
const DARK = '#1a1a1a'
const GREY = '#666666'
const LIGHT_GREY = '#f7f7f7'
const WHITE = '#ffffff'
const BORDER = '#e8e8e8'

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    paddingTop: 40,
    paddingBottom: 52,
    paddingHorizontal: 44,
    backgroundColor: WHITE,
  },

  // Header — logo left; title, a short green rule and the company block right
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
    objectPositionX: 0,
    objectPositionY: 0,
  },
  headerRight: { alignItems: 'flex-end', maxWidth: 240 },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    letterSpacing: 3,
  },
  titleRule: { width: 36, height: 2, backgroundColor: GREEN, marginTop: 6, marginBottom: 8 },
  companyName: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    marginBottom: 3,
  },
  companyDetail: { fontSize: 8, color: GREY, marginBottom: 1.6, textAlign: 'right' },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginTop: 16,
    marginBottom: 16,
  },

  // Bill-to / Meta
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  billBlock: { flex: 1, paddingRight: 24 },
  metaBlock: { width: 210 },
  billLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GREY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  billName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 3,
  },
  billDetail: { fontSize: 8.5, color: GREY, marginBottom: 1.6 },
  metaLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
  },
  metaKey: { fontSize: 8, color: GREY },
  metaVal: { fontSize: 8.5, color: DARK },
  metaValBold: { fontSize: 8.5, color: DARK, fontFamily: 'Helvetica-Bold' },
  amountDueBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: LIGHT_GREEN,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 3,
    marginTop: 7,
  },
  amountDueLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GREEN },
  amountDueVal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: GREEN },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 2,
  },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: LIGHT_GREY },
  colItem: { flex: 5, paddingRight: 6 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right' },
  colAmount: { flex: 2, textAlign: 'right' },

  // Totals — aligned under the Price + Amount columns
  totalsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 18,
  },
  totalsSpacer: { flex: 6 },
  totalsContent: { flex: 4 },
  totalRow: { flexDirection: 'row', paddingVertical: 5 },
  totalRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  totalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK },
  totalVal: { fontSize: 9, color: DARK },

  // Notes
  notesBox: {
    backgroundColor: LIGHT_GREY,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
    padding: 11,
    borderRadius: 2,
    marginBottom: 14,
  },
  notesTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 6,
  },
  notesText: { fontSize: 9, color: DARK, marginBottom: 2, lineHeight: 1.5 },
  policyText: { fontSize: 9, color: GREY, marginBottom: 2, lineHeight: 1.5 },
  notesBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginTop: 5,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    alignItems: 'center',
  },
  gstBadge: {
    backgroundColor: LIGHT_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gstText: { fontSize: 7, color: GREEN, fontFamily: 'Helvetica-Bold' },
})

// ── Component ────────────────────────────────────────────────────────────────

export function InvoiceDocument({ data }: { data: InvoiceDocumentData }) {
  const { issuer } = data
  const totals = invoiceTotals(data.items, data.amountPaid, data.gstIncluded)
  const hasAmountPaid = totals.paid > 0
  const notes = lines(data.notes)

  const meta = [
    { k: 'Invoice Number', v: data.number, bold: true },
    { k: 'Invoice Date', v: longDate(data.issuedOn), bold: false },
    { k: 'Payment Due', v: longDate(data.dueOn), bold: false },
  ]

  return (
    <Document title={`Invoice ${data.number}`} author={issuer.companyName}>
      <Page size="A4" style={s.page}>
        {/* HEADER */}
        <View style={s.header}>
          <Image style={s.logo} src={logoUrl} />
          <View style={s.headerRight}>
            <Text style={s.invoiceTitle}>INVOICE</Text>
            <View style={s.titleRule} />
            <Text style={s.companyName}>{issuer.companyName}</Text>
            {lines(issuer.address).map((l) => (
              <Text key={l} style={s.companyDetail}>
                {l}
              </Text>
            ))}
            {issuer.phone && <Text style={s.companyDetail}>Mobile: {issuer.phone}</Text>}
            {issuer.email && <Text style={s.companyDetail}>{issuer.email}</Text>}
            {issuer.website && <Text style={s.companyDetail}>{issuer.website}</Text>}
            {issuer.abn && <Text style={s.companyDetail}>ABN: {issuer.abn}</Text>}
          </View>
        </View>

        <View style={s.divider} />

        {/* BILL TO + META */}
        <View style={s.metaRow}>
          <View style={s.billBlock}>
            <Text style={s.billLabel}>Bill To</Text>
            <Text style={s.billName}>{data.billToName}</Text>
            {data.billToEmail && <Text style={s.billDetail}>{data.billToEmail}</Text>}
            {data.billToPhone && <Text style={s.billDetail}>{data.billToPhone}</Text>}
          </View>
          <View style={s.metaBlock}>
            {meta.map(({ k, v, bold }) => (
              <View key={k} style={s.metaLine}>
                <Text style={s.metaKey}>{k}</Text>
                <Text style={bold ? s.metaValBold : s.metaVal}>{v}</Text>
              </View>
            ))}
            <View style={s.amountDueBanner}>
              <Text style={s.amountDueLabel}>Amount Due (AUD)</Text>
              <Text style={s.amountDueVal}>{fmt(totals.due)}</Text>
            </View>
          </View>
        </View>

        {/* TABLE */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colItem]}>Items</Text>
          <Text style={[s.thText, s.colQty]}>Qty</Text>
          <Text style={[s.thText, s.colPrice]}>Price</Text>
          <Text style={[s.thText, s.colAmount]}>Amount</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={i % 2 === 1 ? [s.tableRow, s.tableRowAlt] : s.tableRow} wrap={false}>
            <Text style={[s.colItem, { fontSize: 9, color: DARK }]}>{item.description}</Text>
            <Text style={[s.colQty, { fontSize: 9, color: GREY }]}>{item.quantity}</Text>
            <Text style={[s.colPrice, { fontSize: 9, color: GREY }]}>{fmt(item.unitPrice)}</Text>
            <Text style={[s.colAmount, { fontSize: 9, color: DARK }]}>{fmt(invoiceLineAmount(item))}</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={s.totalsContainer} wrap={false}>
          <View style={s.totalsSpacer} />
          <View style={s.totalsContent}>
            {/* Total gets the border only when no amount was paid */}
            <View style={hasAmountPaid ? s.totalRow : [s.totalRow, s.totalRowBorder]}>
              <Text style={[s.colPrice, s.totalLabel]}>Total:</Text>
              <Text style={[s.colAmount, s.totalVal]}>{fmt(totals.total)}</Text>
            </View>
            {hasAmountPaid && (
              <View style={[s.totalRow, s.totalRowBorder]}>
                <Text style={[s.colPrice, s.totalLabel]}>Amount Paid:</Text>
                <Text style={[s.colAmount, s.totalVal]}>-{fmt(totals.paid)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={[s.colPrice, s.totalLabel]}>Amount Due (AUD):</Text>
              <Text style={[s.colAmount, s.totalLabel]}>{fmt(totals.due)}</Text>
            </View>
          </View>
        </View>

        {/* NOTES */}
        <View style={s.notesBox} wrap={false}>
          <Text style={s.notesTitle}>Notes / Terms</Text>
          <Text style={s.notesText}>Banking Details:</Text>
          {issuer.bankAccountName && <Text style={s.notesText}>Account Name: {issuer.bankAccountName}</Text>}
          {issuer.bankBsb && <Text style={s.notesText}>BSB: {issuer.bankBsb}</Text>}
          {issuer.bankAccountNumber && <Text style={s.notesText}>Account number: {issuer.bankAccountNumber}</Text>}
          {notes.map((l, i) => (
            <Text key={i} style={s.notesBold}>
              {l}
            </Text>
          ))}
          <Text style={[s.policyText, { marginTop: 7, fontStyle: 'italic' }]}>
            Upon payment, customer agrees to {issuer.companyName} terms and conditions
          </Text>
        </View>

        {/* FOOTER */}
        <View style={s.footer} fixed>
          {data.gstIncluded && (
            <View style={s.gstBadge}>
              <Text style={s.gstText}>GST Included</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
