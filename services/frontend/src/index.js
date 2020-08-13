$(function () {
  function addMessage(container, author, message, color, date) {
    container.append(
      '<p><span style="color:' +
        color +
        '">' +
        author +
        '</span> @ ' +
        (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) +
        ':' +
        (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) +
        ': ' +
        message +
        '</p>'
    );

    container.scrollTop(container.prop('scrollHeight'));
  }

  $('.chit').each(function () {
    var messagesDiv = $(this).find('.chit-messages');
    var inputField = $(this).find('.chit-message-input');
    var statusLabel = $(this).find('.chit-status');
    var clientColor = false;
    var clientName = false;

    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if (!window.WebSocket) {
      messagesDiv.html(
        'Bitte verwende einen neueren Browser, um den Chat zu nutzen!'
      );
      $(this).find('.chit-input').hide();
      return;
    }

    var connection = new WebSocket(process.env.BACKEND_URL);
    connection.onopen = function () {
      inputField.removeAttr('disabled');
      statusLabel.text('Bitte wähle einen Namen!');
    };

    connection.onerror = function (error) {
      console.error(error);
      messagesDiv.html('Aktuell gibt es Probleme mit der Verbindung.');
    };

    connection.onmessage = function (message) {
      try {
        var json = JSON.parse(message.data);
      } catch (e) {
        console.error('Invalid JSON: ', message.data);
        return;
      }
      if (json.type === 'color') {
        clientColor = json.data;
        statusLabel.text(clientName).css('color', clientColor);
        inputField.removeAttr('disabled').focus();
      } else if (json.type === 'history') {
        for (var i = 0; i < json.data.length; i++) {
          addMessage(
            messagesDiv,
            json.data[i].author,
            json.data[i].text,
            json.data[i].color,
            new Date(json.data[i].time)
          );
        }
      } else if (json.type === 'message') {
        inputField.removeAttr('disabled');
        addMessage(
          messagesDiv,
          json.data.author,
          json.data.text,
          json.data.color,
          new Date(json.data.time)
        );
      } else {
        console.error('Invalid data structure: ', json);
      }
    };

    inputField.keydown(function (e) {
      if (e.keyCode === 13) {
        var msg = $(this).val();
        if (!msg) {
          return;
        }

        connection.send(msg);
        $(this).val('');
        inputField.attr('disabled', 'disabled');

        if (clientName === false) {
          clientName = msg;
        }
      }
    });
  });
});
