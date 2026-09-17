const fs = require('fs');
let content = fs.readFileSync('src/screens/ClientBookingScreen.tsx', 'utf8');

const oldHandleBook = content.match(/const handleBook = \(\) => \{[\s\S]*?\}\;/);
if (oldHandleBook) {
  const newHandleBook = const handleBook = () => {
    if (!selectedDate || !selectedTime) {
      alert('Selecciona fecha y hora.');
      return;
    }
    
    const payment = theme.paymentOptions;
    
    if (payment?.allowBizum) {
      if (window.confirm(\Para confirmar, debes realizar un Bizum al \. ¿Deseas registrar la cita como pendiente de pago?\)) {
        saveBooking();
      }
    } else if (payment?.allowStripe || payment?.allowRedsys || payment?.allowPaypal) {
       if (window.confirm('Serás redirigido a la pasarela de pago seguro online. ¿Deseas continuar?')) {
          saveBooking();
       }
    } else {
       if (window.confirm('Tu cita será confirmada y abonarás el importe en el local. ¿Deseas confirmar la cita?')) {
          saveBooking();
       }
    }
  };;
  content = content.replace(oldHandleBook[0], newHandleBook);
  fs.writeFileSync('src/screens/ClientBookingScreen.tsx', content, 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Could not find handleBook');
}
