package jp.popo.sanpo;

/*
 * ポポさんぽ Android（箱）
 * 役割は2つだけ：
 *   1. Web版（GitHub Pages）を全画面で表示する
 *   2. スマホの歩数センサー（電源が入っている間ずっと数えているもの）をWebに渡す
 * 画面の見た目や動きは全部Web側。ここは滅多に変えない。
 */

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity implements SensorEventListener {

    private static final int REQ_ACTIVITY = 1;

    private WebView web;
    private SensorManager sensorManager;
    private Sensor stepSensor;
    private long stepCounter = -1;      // 電源オンからの累計歩数（センサーの生の値）
    private boolean sensorReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#9FDCFF"));
        w.setNavigationBarColor(Color.parseColor("#E4F5FF"));
        View decor = w.getDecorView();
        decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);        // 記録（localStorage）を使えるようにする
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " PopoSanpoApp/0.2");
        web.setBackgroundColor(Color.parseColor("#BFE7FF"));
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "PopoNative");

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        stepSensor = sensorManager != null ? sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) : null;
        registerSensorIfAllowed();

        web.loadUrl(getString(R.string.app_url));
    }

    /* ===== 権限 ===== */
    private boolean hasPermission() {
        if (Build.VERSION.SDK_INT < 29) return true;
        return checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
    }

    private void registerSensorIfAllowed() {
        if (stepSensor == null || sensorManager == null) return;
        if (!hasPermission()) return;
        sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_ACTIVITY) {
            registerSensorIfAllowed();
            notifyWeb("permission", hasPermission() ? 1 : 0);
        }
    }

    /* ===== センサー ===== */
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_STEP_COUNTER) return;
        stepCounter = (long) event.values[0];
        sensorReady = true;
        notifyWeb("steps", stepCounter);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) { }

    @Override
    protected void onResume() {
        super.onResume();
        registerSensorIfAllowed();
    }

    @Override
    protected void onPause() {
        super.onPause();
        // 画面を閉じている間はスマホ本体が数え続ける。開いたときに差分をもらう
        if (sensorManager != null) sensorManager.unregisterListener(this);
    }

    /* Web側の window.onPopoNative(kind, value) を呼ぶ */
    private void notifyWeb(final String kind, final long value) {
        runOnUiThread(() -> web.evaluateJavascript(
                "window.onPopoNative && window.onPopoNative('" + kind + "', " + value + ")", null));
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    /* ===== Webから呼べる窓口（window.PopoNative） ===== */
    private class Bridge {
        @JavascriptInterface
        public String version() { return "android-0.2"; }

        @JavascriptInterface
        public boolean hasSensor() { return stepSensor != null; }

        @JavascriptInterface
        public boolean hasPermission() { return MainActivity.this.hasPermission(); }

        @JavascriptInterface
        public void requestPermission() {
            if (Build.VERSION.SDK_INT >= 29 && !MainActivity.this.hasPermission()) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.ACTIVITY_RECOGNITION}, REQ_ACTIVITY));
            }
        }

        /* 電源オンからの累計歩数。まだ届いていなければ -1 */
        @JavascriptInterface
        public long getStepCounter() { return sensorReady ? stepCounter : -1; }
    }
}
