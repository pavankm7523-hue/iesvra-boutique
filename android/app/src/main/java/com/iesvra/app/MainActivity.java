package com.iesvra.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Keep the web app below Android's status bar instead of drawing behind it.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
