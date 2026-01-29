import { useState, useEffect } from "react";
import { Card, Input, Button } from "../components/UI";
import { Save, Send } from "lucide-react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const DEFAULT_REMINDER_BODY = `ご予約の日は【明日】です。

ご予約内容は以下の通りです。ご来店を心よりお待ちしております。

日程：{{formatDate reservation_date}}
時間：{{formatTime reservation_time}}
予約卓：{{table_name}}

予約の確認・キャンセルは↓こちら↓
{{liff_url}}

電話は↓こちら↓
{{store_phone}}`;

const DEFAULT_CONFIRMATION_BODY = `次の内容で予約を承りました。
ご来店お待ちしております。

お名前：{{customer_name}}
電話番号：{{customer_phone}}
ご予約日：{{reservation_date}}
ご予約時間：{{reservation_time}}`;

export const Templates = () => {
    const [reminderTemplate, setReminderTemplate] = useState<any>(null);
    const [confirmationTemplate, setConfirmationTemplate] = useState<any>(null);
    const [notificationSettings, setNotificationSettings] = useState({ liffBaseUrl: "", storePhone: "", adminLineUserId: "" });
    const [loadingReminder, setLoadingReminder] = useState(false);
    const [loadingConfirmation, setLoadingConfirmation] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [loadingTest, setLoadingTest] = useState(false);

    useEffect(() => {
        // Fetch all templates and settings with error handling
        axios.get(`${apiBase}/api/templates/reminder`)
            .then(res => setReminderTemplate(res.data || { title: "ご予約の前日リマインダー", body: DEFAULT_REMINDER_BODY, enabled: true }))
            .catch(() => setReminderTemplate({ title: "ご予約の前日リマインダー", body: DEFAULT_REMINDER_BODY, enabled: true }));

        axios.get(`${apiBase}/api/templates/confirmation`)
            .then(res => setConfirmationTemplate(res.data || { title: "予約確認", body: DEFAULT_CONFIRMATION_BODY, enabled: true }))
            .catch(() => setConfirmationTemplate({ title: "予約確認", body: DEFAULT_CONFIRMATION_BODY, enabled: true }));

        axios.get(`${apiBase}/api/settings/notification`)
            .then(res => setNotificationSettings(res.data || { liffBaseUrl: "", storePhone: "070-8328-6648", adminLineUserId: "" }))
            .catch(() => setNotificationSettings({ liffBaseUrl: "", storePhone: "070-8328-6648", adminLineUserId: "" }));
    }, []);

    const handleSaveReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingReminder(true);
        try {
            await axios.put(`${apiBase}/api/templates/reminder`, reminderTemplate);
            alert("リマインダーテンプレートを保存しました");
        } catch (err) {
            alert("保存に失敗しました");
        } finally {
            setLoadingReminder(false);
        }
    };

    const handleSaveConfirmation = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingConfirmation(true);
        try {
            await axios.put(`${apiBase}/api/templates/confirmation`, confirmationTemplate);
            alert("予約確認テンプレートを保存しました");
        } catch (err) {
            alert("保存に失敗しました");
        } finally {
            setLoadingConfirmation(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingSettings(true);
        try {
            await axios.put(`${apiBase}/api/settings/notification`, notificationSettings);
            alert("通知設定を保存しました");
        } catch (err) {
            alert("保存に失敗しました");
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleTestReminder = async () => {
        if (!confirm("明日の予約があるお客様にリマインダーをテスト送信します。\nよろしいですか？")) return;
        setLoadingTest(true);
        try {
            const res = await axios.post(`${apiBase}/api/reminders/test`);
            const data = res.data;
            let msg = `対象日: ${data.targetDate}\n予約件数: ${data.reservationCount}件\n\n`;
            if (data.reservationCount === 0) {
                msg += "明日の予約がありません。";
            } else {
                for (const r of data.results) {
                    msg += `${r.customerName}: ${r.status === 'sent' ? '✅送信成功' : '❌失敗'} (LINE ID: ${r.lineUserId})${r.error ? ` - ${r.error}` : ''}\n`;
                }
            }
            alert(msg);
        } catch (err: any) {
            alert("送信に失敗しました: " + (err.response?.data?.error || err.message));
        } finally {
            setLoadingTest(false);
        }
    };

    if (!reminderTemplate || !confirmationTemplate) return <div>Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">テンプレート設定</h1>
                <p className="text-slate-500">自動通知メッセージの編集</p>
            </div>

            {/* Confirmation Template (for LIFF sendMessages) */}
            <form onSubmit={handleSaveConfirmation}>
                <Card className="border-0 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                        予約完了通知（予約者→店舗Bot）
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">予約完了時にお客様のLINEから店舗Botへ送信されるメッセージです</p>

                    <Input
                        label="通知タイトル"
                        value={confirmationTemplate.title}
                        onChange={(e: any) => setConfirmationTemplate({ ...confirmationTemplate, title: e.target.value })}
                    />

                    <div className="flex-col flex gap-1 mb-4">
                        <label className="text-sm font-medium text-slate-500">本文</label>
                        <textarea
                            className="input-field min-h-[180px]"
                            value={confirmationTemplate.body}
                            onChange={e => setConfirmationTemplate({ ...confirmationTemplate, body: e.target.value })}
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-6">
                        <strong>利用可能な変数:</strong><br />
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{customer_name}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{customer_phone}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{reservation_date}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{reservation_time}}"}</code>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" loading={loadingConfirmation}>
                            <Save size={18} /> テンプレートを保存
                        </Button>
                    </div>
                </Card>
            </form>

            {/* Reminder Template */}
            <form onSubmit={handleSaveReminder}>
                <Card className="border-0 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                        前日リマインダー（店舗Bot→予約者）
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">予約日の前日12時に予約者へ送信されるメッセージです</p>

                    <Input
                        label="通知タイトル (プッシュ通知用)"
                        value={reminderTemplate.title}
                        onChange={(e: any) => setReminderTemplate({ ...reminderTemplate, title: e.target.value })}
                    />

                    <div className="flex-col flex gap-1 mb-4">
                        <label className="text-sm font-medium text-slate-500">本文</label>
                        <textarea
                            className="input-field min-h-[200px]"
                            value={reminderTemplate.body}
                            onChange={e => setReminderTemplate({ ...reminderTemplate, body: e.target.value })}
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-6">
                        <strong>利用可能な変数:</strong><br />
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{customer_name}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{formatDate reservation_date}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{formatTime reservation_time}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{table_name}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{liff_url}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{store_phone}}"}</code>
                    </div>

                    <div className="flex justify-between items-center">
                        <Button type="button" variant="secondary" loading={loadingTest} onClick={handleTestReminder}>
                            <Send size={18} /> テスト送信
                        </Button>
                        <Button type="submit" loading={loadingReminder}>
                            <Save size={18} /> テンプレートを保存
                        </Button>
                    </div>
                </Card>
            </form>

            {/* Notification Settings */}
            <form onSubmit={handleSaveSettings}>
                <Card className="border-0 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                        通知設定
                    </h3>

                    <Input
                        label="LIFF URL (予約確認ページ)"
                        value={notificationSettings.liffBaseUrl}
                        onChange={(e: any) => setNotificationSettings({ ...notificationSettings, liffBaseUrl: e.target.value })}
                        placeholder="https://liff.line.me/xxxxxxxxx"
                    />

                    <Input
                        label="店舗電話番号"
                        value={notificationSettings.storePhone}
                        onChange={(e: any) => setNotificationSettings({ ...notificationSettings, storePhone: e.target.value })}
                        placeholder="070-8328-6648"
                    />

                    <Input
                        label="管理者LINE User ID（予約通知の送信先）"
                        value={notificationSettings.adminLineUserId}
                        onChange={(e: any) => setNotificationSettings({ ...notificationSettings, adminLineUserId: e.target.value })}
                        placeholder="U1234567890abcdef..."
                    />
                    <p className="text-xs text-slate-500 -mt-2 mb-4">予約が入った時に通知を受け取るLINEアカウントのUser IDを入力してください</p>

                    <div className="flex justify-end mt-4">
                        <Button type="submit" loading={loadingSettings}>
                            <Save size={18} /> 設定を保存
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};
