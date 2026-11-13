package com.iptv.app

import android.os.Bundle
import android.view.View
import android.widget.Toast
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.source.hls.HlsMediaSource
import com.google.android.exoplayer2.upstream.DataSource
import com.google.android.exoplayer2.upstream.DefaultHttpDataSource
import com.iptv.app.databinding.ActivityPlayerBinding

class PlayerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPlayerBinding
    private lateinit var player: ExoPlayer

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val title = intent.getStringExtra("channel_title") ?: getString(R.string.channel_unknown)
        val url = intent.getStringExtra("channel_url") ?: ""

        binding.tvTitle.text = title

        initializePlayer(url)
    }

    private fun initializePlayer(url: String) {
        player = ExoPlayer.Builder(this).build()
        binding.playerView.player = player

        val dataSourceFactory: DataSource.Factory = DefaultHttpDataSource.Factory()
            .setUserAgent("IPTV-App/1.0")

        val mediaSource = HlsMediaSource.Factory(dataSourceFactory)
            .createMediaSource(MediaItem.fromUri(url))

        binding.loading.visibility = View.VISIBLE

        player.addListener(object : com.google.android.exoplayer2.Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                binding.loading.visibility = if (isPlaying) View.GONE else View.VISIBLE
            }
            override fun onPlayerError(error: com.google.android.exoplayer2.PlaybackException) {
                binding.loading.visibility = View.GONE
                Toast.makeText(this@PlayerActivity, R.string.error_playback, Toast.LENGTH_LONG).show()
            }
        })

        player.setMediaSource(mediaSource)
        player.prepare()
        player.play()
    }

    override fun onPause() {
        super.onPause()
        player.pause()
    }

    override fun onResume() {
        super.onResume()
        player.play()
    }

    override fun onDestroy() {
        super.onDestroy()
        player.release()
    }
}
