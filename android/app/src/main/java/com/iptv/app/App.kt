package com.iptv.app

import android.app.Application
import androidx.room.Room

class App : Application() {
    companion object {
        lateinit var instance: App
            private set
        val database by lazy {
            AppDatabase.getDatabase(instance)
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }
}
